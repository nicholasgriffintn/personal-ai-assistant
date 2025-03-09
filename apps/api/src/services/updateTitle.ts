import type { IEnv } from "../types";
import { ChatHistory } from "../lib/history";

interface UpdateTitleParams {
  env: IEnv;
  chatId: string;
  title: string;
}

export async function handleUpdateTitle({
  env,
  chatId,
  title,
}: UpdateTitleParams): Promise<{ title: string }> {
  if (!env.AI) {
    throw new Error("AI binding is not available");
  }

  const history = ChatHistory.getInstance({
    history: env.CHAT_HISTORY,
  });
  
  let newTitle = title.trim();
  
  if ((title.startsWith('"') && title.endsWith('"')) || 
      (title.startsWith("'") && title.endsWith("'"))) {
    newTitle = title.slice(1, -1);
  }
  
  if (newTitle.length > 50) {
    newTitle = newTitle.substring(0, 47) + "...";
  }
  
  if (!newTitle) {
    newTitle = "New Conversation";
  }

  const existingMessages = await history.get(chatId);
  
  if (existingMessages.length > 0) {
    existingMessages[0].data = {
      ...(existingMessages[0].data || {}),
      title: newTitle,
    };
    
    await history.update(chatId, existingMessages);
  }

  return { title: newTitle };
} 