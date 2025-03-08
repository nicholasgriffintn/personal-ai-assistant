import type { IEnv, Message } from "../types";
import { ChatHistory } from "../lib/history";

interface GenerateTitleParams {
  env: IEnv;
  chatId: string;
  messages?: Message[];
}

export async function handleGenerateTitle({
  env,
  chatId,
  messages: providedMessages,
}: GenerateTitleParams): Promise<{ title: string }> {
  if (!env.AI) {
    throw new Error("AI binding is not available");
  }

  const history = ChatHistory.getInstance({
    history: env.CHAT_HISTORY,
  });
  
  let messagesToUse: Message[] = [];
  
  if (providedMessages && providedMessages.length > 0) {
    messagesToUse = providedMessages.slice(0, Math.min(3, providedMessages.length));
  } else {
    const existingMessages = await history.get(chatId);
    messagesToUse = existingMessages.slice(0, Math.min(3, existingMessages.length));
    
    if (existingMessages.length === 0) {
      return { title: "New Conversation" };
    }
  }
  
  const prompt = `
    Generate a short, concise title (maximum 5 words) for this conversation.
    The title should capture the main topic or intent of the conversation.
    
    Conversation:
    ${messagesToUse
      .map((msg) => `${msg.role.toUpperCase()}: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}`)
      .join("\n")}
    
    Title:
  `;

  const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    prompt,
    max_tokens: 10,
  });

  // @ts-expect-error
  let title = response.response.trim();
  
  if ((title.startsWith('"') && title.endsWith('"')) || 
      (title.startsWith("'") && title.endsWith("'"))) {
    title = title.slice(1, -1);
  }
  
  if (title.length > 50) {
    title = title.substring(0, 47) + "...";
  }
  
  if (!title) {
    title = "New Conversation";
  }

  const existingMessages = await history.get(chatId);
  
  if (existingMessages.length > 0) {
    existingMessages[0].data = {
      ...(existingMessages[0].data || {}),
      title,
    };
    
    await history.update(chatId, existingMessages);
  }

  return { title };
} 