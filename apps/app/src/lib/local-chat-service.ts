import type { Conversation, Message } from "../types";

const LOCAL_CHATS_STORAGE_KEY = "local_chats";

class LocalChatService {
  private static instance: LocalChatService;

  private constructor() {}

  public static getInstance(): LocalChatService {
    if (!LocalChatService.instance) {
      LocalChatService.instance = new LocalChatService();
    }
    return LocalChatService.instance;
  }

  private getLocalChats(): Conversation[] {
    const data = localStorage.getItem(LOCAL_CHATS_STORAGE_KEY);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Error parsing local chats:", error);
      return [];
    }
  }

  private saveLocalChats(chats: Conversation[]): void {
    localStorage.setItem(LOCAL_CHATS_STORAGE_KEY, JSON.stringify(chats));
  }

  public listLocalChats(): Conversation[] {
    return this.getLocalChats();
  }

  public getLocalChat(chatId: string): Conversation | null {
    const chats = this.getLocalChats();
    return chats.find(chat => chat.id === chatId) || null;
  }

  public saveLocalChat(chat: Conversation): void {
    const chats = this.getLocalChats();
    const existingIndex = chats.findIndex(c => c.id === chat.id);
    
    const chatWithFlag = {
      ...chat,
      isLocalOnly: true
    };
    
    if (existingIndex >= 0) {
      chats[existingIndex] = chatWithFlag;
    } else {
      chats.push(chatWithFlag);
    }
    
    this.saveLocalChats(chats);
  }

  public updateLocalChatMessages(chatId: string, messages: Message[]): void {
    const chats = this.getLocalChats();
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    
    if (chatIndex >= 0) {
      chats[chatIndex].messages = messages;
      this.saveLocalChats(chats);
    }
  }

  public updateLocalChatTitle(chatId: string, title: string): void {
    const chats = this.getLocalChats();
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    
    if (chatIndex >= 0) {
      chats[chatIndex].title = title;
      this.saveLocalChats(chats);
    }
  }

  public deleteLocalChat(chatId: string): void {
    const chats = this.getLocalChats();
    const filteredChats = chats.filter(chat => chat.id !== chatId);
    this.saveLocalChats(filteredChats);
  }
}

export const localChatService = LocalChatService.getInstance(); 