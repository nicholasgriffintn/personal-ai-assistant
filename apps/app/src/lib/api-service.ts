import { apiBaseUrl } from "../constants";
import { apiKeyService } from "./api-key";
import type { Conversation, Message, ChatMode, ChatSettings } from "../types";

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public getApiBaseUrl(): string {
    return apiBaseUrl;
  }

  public async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = await apiKeyService.getApiKey();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    return headers;
  }

  async listChats(): Promise<Conversation[]> {
    const headers = await this.getHeaders();
    
    try {
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to list chats: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.response || !data.response.keys || !Array.isArray(data.response.keys)) {
        console.error("Unexpected response format from /chat endpoint:", data);
        return [];
      }
      
      const chatIds = data.response.keys.map((key: { name: string }) => key.name);
      
      const results: Conversation[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < chatIds.length; i += batchSize) {
        const batch = chatIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (chatId: string) => {
          try {
            return await this.getChat(chatId);
          } catch (error) {
            console.error(`Failed to fetch chat ${chatId}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter((result): result is Conversation => result !== null));
      }
      
      return results.sort((a, b) => {
        const aTimestamp = a.messages.length > 0 ? a.messages[a.messages.length - 1].created || 0 : 0;
        const bTimestamp = b.messages.length > 0 ? b.messages[b.messages.length - 1].created || 0 : 0;
        return bTimestamp - aTimestamp;
      });
    } catch (error) {
      console.error("Error listing chats:", error);
      return [];
    }
  }

  async getChat(chatId: string): Promise<Conversation> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${apiBaseUrl}/chat/${chatId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat: ${response.statusText}`);
    }

    const messages = await response.json();
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        id: chatId,
        title: "New conversation",
        messages: [],
      };
    }
    
    const title = messages[0].data?.title 
      ? messages[0].data.title 
      : "New conversation";
    
    const transformedMessages = messages.map((msg: any) => ({
      ...msg,
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      id: msg.id || crypto.randomUUID(),
      created: msg.timestamp || Date.now(),
      model: msg.model || "",
      citations: msg.citations || null,
      reasoning: msg.reasoning ? {
        collapsed: true,
        content: msg.reasoning
      } : undefined,
      logId: msg.logId,
    }));
    
    return {
      id: chatId,
      title,
      messages: transformedMessages,
    };
  }

  async createChat(
    chatId: string, 
    message: Message, 
    model: string, 
    mode: ChatMode,
    chatSettings: ChatSettings
  ): Promise<Message> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${apiBaseUrl}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chat_id: chatId,
        input: message.content,
        date: new Date().toISOString(),
        model,
        mode,
        platform: "web",
        responseMode: chatSettings.responseMode || "normal",
        ...chatSettings,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      role: "assistant",
      content: typeof data.response.content === 'string' 
        ? data.response.content 
        : JSON.stringify(data.response.content),
      id: data.response.id || crypto.randomUUID(),
      created: data.response.timestamp || Date.now(),
      model: data.response.model || model,
      citations: data.response.citations || null,
      reasoning: data.response.reasoning ? {
        collapsed: true,
        content: data.response.reasoning
      } : undefined,
      logId: data.response.logId,
    };
  }

  async generateTitle(chatId: string, messages: Message[]): Promise<string> {
    const headers = await this.getHeaders();
    
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    const response = await fetch(`${apiBaseUrl}/chat/generate-title`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chat_id: chatId,
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate title: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response.title;
  }

  async streamChatCompletions(
    chatId: string,
    messages: Message[],
    model: string,
    mode: ChatMode,
    chatSettings: ChatSettings,
    signal: AbortSignal,
    onProgress: (text: string) => void
  ): Promise<Message> {
    const headers = await this.getHeaders();

    const filteredMessages = messages.filter(msg => msg.role !== "tool");
    
    const formattedMessages = filteredMessages.map(msg => ({
      role: msg.role,
      content: [{ type: "text", text: msg.content }],
    }));
    
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chat_id: chatId,
        model,
        mode,
        messages: formattedMessages,
        platform: "web",
        responseMode: chatSettings.responseMode || "normal",
        ...chatSettings,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to stream chat completions: ${response.statusText}`);
    }

    const data = await response.json();
    let content = "";
    let reasoning = "";
    
    for (const choice of data.choices) {
      if (choice.message.role === "assistant" && choice.message.content) {
        const messageContent = choice.message.content;
        const analysisMatch = messageContent.match(/<analysis>(.*?)<\/analysis>/s);
        
        if (analysisMatch) {
          reasoning = analysisMatch[1].trim();
        }

        const cleanedContent = messageContent
          .replace(/<analysis>.*?<\/analysis>/gs, "")
          .replace(/<answer>.*?(<\/answer>)?/gs, "")
          .replace(/<answer>/g, "")
          .replace(/<\/answer>/g, "")
          .trim();

        content = cleanedContent;
        onProgress(content);
      } else if (choice.message.role === "tool") {
        content = choice.message.content;
        onProgress(content);
      }
    }

    return {
      role: "assistant",
      content,
      reasoning: reasoning ? {
        collapsed: false,
        content: reasoning,
      } : undefined,
      id: data.id || crypto.randomUUID(),
      created: data.created || Date.now(),
      model: data.model || model,
      citations: data.choices[0]?.message.citations || null,
      usage: data.usage,
      logId: data.logId,
    };
  }

  async updateConversationTitle(chatId: string, newTitle: string): Promise<void> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${apiBaseUrl}/chat/${chatId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    const messages = await response.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error(`Conversation with ID ${chatId} has no messages`);
    }

    messages[0].data = {
      ...(messages[0].data || {}),
      title: newTitle,
    };

    const updateResponse = await fetch(`${apiBaseUrl}/chat/${chatId}/update`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update conversation title: ${updateResponse.statusText}`);
    }
  }

  async deleteConversation(chatId: string): Promise<void> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${apiBaseUrl}/chat/${chatId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
  }

  async submitFeedback(logId: string, feedback: 1 | -1, score: number = 50): Promise<void> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${apiBaseUrl}/chat/feedback`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        logId,
        feedback,
        score
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
  }
}

export const apiService = ApiService.getInstance(); 