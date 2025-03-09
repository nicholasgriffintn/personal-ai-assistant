import { API_BASE_URL } from "../constants";
import { apiKeyService } from "./api-key";
import type { Conversation, Message, ChatMode, ChatSettings, ModelConfig } from "../types";

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
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

  private getFetchOptions(method: string, headers: Record<string, string>, body?: any): RequestInit {
    return {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    };
  }

  async listChats(): Promise<Conversation[]> {
    const headers = await this.getHeaders();
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, 
        this.getFetchOptions("GET", headers)
      );

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
    
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, 
      this.getFetchOptions("GET", headers)
    );

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
    
    const transformedMessages = messages.map((msg: any) => {
      let content = msg.content;
      let reasoning = msg.reasoning;
      
      if (typeof content === 'string') {
        const formatted = this.formatMessageContent(content);
        content = formatted.content;
        
        if (formatted.reasoning && !reasoning) {
          reasoning = formatted.reasoning;
        }
      } else if (content) {
        content = JSON.stringify(content);
      }
      
      return {
        ...msg,
        role: msg.role,
        content: content,
        id: msg.id || crypto.randomUUID(),
        created: msg.timestamp || Date.now(),
        model: msg.model || "",
        citations: msg.citations || null,
        reasoning: reasoning ? {
          collapsed: true,
          content: reasoning
        } : undefined,
        logId: msg.logId,
      };
    });
    
    return {
      id: chatId,
      title,
      messages: transformedMessages,
    };
  }

  private formatMessageContent(messageContent: string): { content: string, reasoning: string } {
    let reasoning = "";
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

    return {
      content: cleanedContent,
      reasoning
    };
  }

  async generateTitle(chatId: string, messages: Message[]): Promise<string> {
    const headers = await this.getHeaders();
    
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    const response = await fetch(`${API_BASE_URL}/chat/generate-title`, 
      this.getFetchOptions("POST", headers, {
        chat_id: chatId,
        messages: formattedMessages,
      })
    );

    if (!response.ok) {
      throw new Error(`Failed to generate title: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response.title;
  }

  async updateConversationTitle(chatId: string, newTitle: string): Promise<void> {
    const headers = await this.getHeaders();

    const updateResponse = await fetch(`${API_BASE_URL}/chat/update-title`, 
      this.getFetchOptions("PUT", headers, {
        chat_id: chatId,
        title: newTitle,
      })
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update chat title: ${updateResponse.statusText}`);
    }
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
    
    const formattedMessages = filteredMessages.map(msg => {
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role,
          content: msg.content,
        };
      }
      
      return {
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      };
    });
    
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      ...this.getFetchOptions("POST", headers, {
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
        if (Array.isArray(choice.message.content)) {
          content = choice.message.content;
          const textContent = choice.message.content
            .filter((item: { type: string; text?: string }) => item.type === 'text' && item.text)
            .map((item: { text?: string }) => item.text || '')
            .join('\n');
          onProgress(textContent);
        } else {
          const messageContent = choice.message.content;
          const { content: formattedContent, reasoning: extractedReasoning } = this.formatMessageContent(messageContent);
          
          content = formattedContent;
          reasoning = extractedReasoning;
          onProgress(content);
        }
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
    };
  }

  async deleteConversation(chatId: string): Promise<void> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, 
      this.getFetchOptions("DELETE", headers)
    );

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }
  }

  async submitFeedback(logId: string, feedback: 1 | -1, score: number = 50): Promise<void> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/chat/feedback`, 
      this.getFetchOptions("POST", headers, {
        log_id: logId,
        feedback,
        score,
      })
    );

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
  }

  async fetchModels(): Promise<ModelConfig> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/models`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      const responseData = await response.json();

      return responseData.data;
    } catch (error) {
      console.error("Error fetching models:", error);
      return {};
    }
  }
}

export const apiService = ApiService.getInstance(); 