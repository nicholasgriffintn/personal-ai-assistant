import type { Conversation, Message } from "../types/chat";
import { storeName, getDatabase } from "../hooks/useIndexedDB";

/**
 * Service for managing local chat conversations using IndexedDB.
 * This is a singleton service that provides methods for CRUD operations on chat data.
 */
class LocalChatService {
  private static instance: LocalChatService;

  private constructor() {}

  /**
   * Get the singleton instance of the LocalChatService.
   */
  public static getInstance(): LocalChatService {
    if (!LocalChatService.instance) {
      LocalChatService.instance = new LocalChatService();
    }
    return LocalChatService.instance;
  }

  /**
   * Get all local chats from IndexedDB.
   */
  private async getLocalChats(): Promise<Conversation[]> {
    try {
      const db = await getDatabase();
      const allChats = await db.getAll(storeName);
      return allChats || [];
    } catch (error) {
      console.error("Error retrieving local chats from IndexedDB:", error);
      return [];
    }
  }

  /**
   * Save a chat to IndexedDB.
   * @param chat The chat to save
   */
  public async saveLocalChat(chat: Conversation): Promise<void> {
    const chatWithFlag = {
      ...chat,
      isLocalOnly: true
    };
    
    // Ensure chat has an ID
    if (!chatWithFlag.id) {
      chatWithFlag.id = crypto.randomUUID();
    }
    
    try {
      const db = await getDatabase();
      await db.put(storeName, chatWithFlag);
    } catch (error) {
      console.error("Error saving chat to IndexedDB:", error);
    }
  }

  /**
   * List all local chats.
   */
  public async listLocalChats(): Promise<Conversation[]> {
    return this.getLocalChats();
  }


  /**
   * Get a specific chat by ID.
   * @param chatId The ID of the chat to get
   */
  public async getLocalChat(chatId: string): Promise<Conversation | null> {
    try {
      const db = await getDatabase();
      const chat = await db.get(storeName, chatId);
      return chat || null;
    } catch (error) {
      console.error("Error retrieving chat from IndexedDB:", error);
      return null;
    }
  }

  /**
   * Update the messages of a chat.
   * @param chatId The ID of the chat to update
   * @param messages The new messages
   */
  public async updateLocalChatMessages(chatId: string, messages: Message[]): Promise<void> {
    try {
      const chat = await this.getLocalChat(chatId);
      
      if (chat) {
        chat.messages = messages;
        await this.saveLocalChat(chat);
      }
    } catch (error) {
      console.error("Error updating chat messages in IndexedDB:", error);
    }
  }

  /**
   * Update the title of a chat.
   * @param chatId The ID of the chat to update
   * @param title The new title
   */
  public async updateLocalChatTitle(chatId: string, title: string): Promise<void> {
    try {
      const chat = await this.getLocalChat(chatId);
      
      if (chat) {
        chat.title = title;
        await this.saveLocalChat(chat);
      }
    } catch (error) {
      console.error("Error updating chat title in IndexedDB:", error);
    }
  }

  /**
   * Delete a chat.
   * @param chatId The ID of the chat to delete
   */
  public async deleteLocalChat(chatId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.delete(storeName, chatId);
    } catch (error) {
      console.error("Error deleting chat from IndexedDB:", error);
    }
  }
}

export const localChatService = LocalChatService.getInstance(); 