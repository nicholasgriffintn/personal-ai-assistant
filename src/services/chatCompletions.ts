import { processChatRequest } from "./chat/core";
import type { ChatRole, IEnv, RagOptions } from "../types";
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
  ragOptions?: RagOptions;
  shouldSave?: boolean;
  platform?: "web" | "mobile" | "api";
  budgetConstraint?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model?: string;
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

  const result = await processChatRequest({
    env,
    messages: request.messages,
    chatId: request.chat_id,
    model: request.model,
    useRAG: request.useRAG,
    ragOptions: request.ragOptions,
    shouldSave: request.shouldSave,
    platform: request.platform,
    budgetConstraint: request.budgetConstraint,
    temperature: request.temperature,
    max_tokens: request.max_tokens,
    top_p: request.top_p,
    user,
    appUrl,
  });

  if ("validation" in result) {
    return {
      id: env.AI.aiGatewayLogId || result.chatId || `chat_${Date.now()}`,
      object: "chat.completion",
      created: Date.now(),
      model: result.selectedModel,
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: result.error,
        },
        finish_reason: "content_filter",
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  return {
    id: env.AI.aiGatewayLogId || result.chatId || `chat_${Date.now()}`,
    object: "chat.completion",
    created: Date.now(),
    model: result.selectedModel,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: result.response.response,
          tool_calls: result.response.tool_calls,
          citations: result.response.citations || null,
        },
        finish_reason: result.response.tool_calls?.length ? "tool_calls" : "stop",
      },
    ],
    usage: result.response.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}; 