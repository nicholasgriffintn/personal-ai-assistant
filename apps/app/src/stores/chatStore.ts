import { create } from 'zustand';

import type { Conversation } from '../types';

export interface ChatStore {
  conversations: Conversation[];
  setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
  currentConversationId: number | undefined;
  setCurrentConversationId: (id: number | undefined) => void;
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  (set) => ({
    conversations: [],
    setConversations: (conversations) => set((state) => ({ 
      conversations: typeof conversations === 'function' 
        ? conversations(state.conversations) 
        : conversations 
    })),
    currentConversationId: undefined,
    setCurrentConversationId: (id) => set({ currentConversationId: id }),
    sidebarVisible: true,
    setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  })
); 