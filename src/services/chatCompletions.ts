import { getAIResponse, handleToolCalls } from "../lib/chat";
import { Embedding } from "../lib/embedding";
import { Guardrails } from "../lib/guardrails";
import { ChatHistory } from "../lib/history";
import { getModelConfigByMatchingModel } from "../lib/models";
import { ModelRouter } from "../lib/modelRouter";
import { getSystemPrompt } from "../lib/prompts";
import type { Attachment, ChatRole, IEnv, Message, MessageContent } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";

export interface ChatCompletionsRequest {
  model?: string;
  messages: Array<{
    role: ChatRole;
    content: string | Array<{
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
        detail?: "auto" | "low" | "high";
      };
    }>;
    name?: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: {
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }[];
  tool_choice?: "none" | "auto" | { type: "function"; function: { name: string } };
  chat_id?: string;
  useRAG?: boolean;
  ragOptions?: {
    topK?: number;
    scoreThreshold?: number;
    includeMetadata?: boolean;
  };
  shouldSave?: boolean;
  platform?: "web" | "mobile" | "api";
  budgetConstraint?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: ChatRole;
      content: string;
      tool_calls?: any[];
      citations?: any[] | null;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const handleChatCompletions = async (
  req: {
    env: IEnv;
    request: ChatCompletionsRequest;
    user?: { email: string };
    appUrl?: string;
  }
): Promise<ChatCompletionResponse> => {
  const { env, request, user, appUrl } = req;

  if (!request.messages?.length) {
    throw new AssistantError(
      "Missing required parameter: messages",
      ErrorType.PARAMS_ERROR
    );
  }

  if (!env.CHAT_HISTORY) {
    throw new AssistantError(
      "Missing CHAT_HISTORY binding",
      ErrorType.CONFIGURATION_ERROR
    );
  }

  const lastMessage = request.messages[request.messages.length - 1];
  const messageContent = Array.isArray(lastMessage.content) ? lastMessage.content : [{ type: "text" as const, text: lastMessage.content }];
  
  const textContent = messageContent.find(c => c.type === "text")?.text || "";
  const imageAttachments: Attachment[] = messageContent
    .filter(c => c.type === "image_url" && c.image_url)
    .map(c => {
      const detail = (c as { image_url: { detail?: "low" | "high" | "auto" } }).image_url.detail;
      return {
        type: "image",
        url: (c as { image_url: { url: string } }).image_url.url,
        detail: detail === "auto" ? undefined : detail
      };
    });

  const selectedModel = request.model || await ModelRouter.selectModel(
    env,
    textContent,
    imageAttachments,
    request.budgetConstraint
  );

  const modelConfig = getModelConfigByMatchingModel(selectedModel);
  if (!modelConfig) {
    throw new AssistantError(
      `No matching model found for: ${selectedModel}`,
      ErrorType.PARAMS_ERROR
    );
  }

  const chatId = request.chat_id || `chat_${Date.now()}`;
  const guardrails = Guardrails.getInstance(env);
  const embedding = Embedding.getInstance(env);
  const chatHistory = ChatHistory.getInstance({
    history: env.CHAT_HISTORY,
    model: selectedModel,
    platform: request.platform || "api",
    shouldSave: request.shouldSave ?? true,
  });

  const systemMessage = request.messages.find(msg => msg.role === "system" as ChatRole);
  const systemPrompt = typeof systemMessage?.content === "string" 
    ? systemMessage.content 
    : getSystemPrompt({ 
        chat_id: chatId,
        input: "",
        model: selectedModel,
        date: new Date().toISOString().split("T")[0],
      }, 
      selectedModel, 
      user
    );

  const messages = request.messages.filter(msg => msg.role !== "system" as ChatRole);

  const inputValidation = await guardrails.validateInput(textContent);
  if (!inputValidation.isValid) {
    return {
      id: env.AI.aiGatewayLogId || `chat_${Date.now()}`,
      object: "chat.completion",
      created: Date.now(),
      model: selectedModel,
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: inputValidation.rawResponse?.blockedResponse || "Input did not pass safety checks",
        },
        finish_reason: "content_filter",
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  const messageToStore: Message & { content: string } = {
    role: lastMessage.role,
    content: textContent,
  };

  await chatHistory.add(chatId, messageToStore);

  if (imageAttachments.length > 0) {
    const attachmentMessage: Message = {
      role: lastMessage.role,
      content: "Attached images",
      data: { attachments: imageAttachments }
    };
    await chatHistory.add(chatId, attachmentMessage);
  }

  const finalMessage = request.useRAG === true
    ? await embedding.augmentPrompt(textContent, request.ragOptions)
    : textContent;

  const response = await getAIResponse({
    env,
    chatId,
    appUrl,
    model: selectedModel,
    systemPrompt,
    messages,
    message: finalMessage,
    temperature: request.temperature,
    max_tokens: request.max_tokens,
    top_p: request.top_p,
  });

  if (!response.response) {
    throw new AssistantError(
      "No response generated by the model",
      ErrorType.PARAMS_ERROR
    );
  }

  const outputValidation = await guardrails.validateOutput(response.response);
  if (!outputValidation.isValid) {
    return {
      id: chatId,
      object: "chat.completion",
      created: Date.now(),
      model: selectedModel,
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: outputValidation.rawResponse?.blockedResponse || "Response did not pass safety checks",
        },
        finish_reason: "content_filter",
      }],
      usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  if (response.tool_calls?.length > 0) {
    const toolResults = await handleToolCalls(
      chatId,
      response,
      chatHistory,
      {
        env,
        request: {
          chat_id: chatId,
          input: finalMessage,
          model: selectedModel,
          date: new Date().toISOString().split("T")[0],
        },
        appUrl,
        user,
      }
    );

    for (const result of toolResults) {
      await chatHistory.add(chatId, result);
    }
  }

  await chatHistory.add(chatId, {
    role: "assistant",
    content: response.response,
    citations: response.citations || null,
    logId: env.AI.aiGatewayLogId || response.logId,
  });

  return {
    id: env.AI.aiGatewayLogId || `chat_${Date.now()}`,
    object: "chat.completion",
    created: Date.now(),
    model: selectedModel,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: response.response,
          tool_calls: response.tool_calls,
          citations: response.citations || null,
        },
        finish_reason: response.tool_calls?.length ? "tool_calls" : "stop",
      },
    ],
    usage: response.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}; 