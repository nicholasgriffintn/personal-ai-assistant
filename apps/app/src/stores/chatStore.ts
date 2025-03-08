import { create } from "zustand";

import { apiKeyService } from "../lib/api-key";

export interface ChatStore {
	currentConversationId: string | undefined;
	setCurrentConversationId: (id: string | undefined) => void;
	sidebarVisible: boolean;
	setSidebarVisible: (visible: boolean) => void;
	startNewConversation: () => void;
	hasApiKey: boolean;
	setHasApiKey: (hasApiKey: boolean) => void;
	initializeStore: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
	currentConversationId: undefined,
	setCurrentConversationId: (id) => set({ currentConversationId: id }),
	sidebarVisible: true,
	setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
	startNewConversation: () => {
		const newId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		set({ currentConversationId: newId });
	},
	hasApiKey: false,
	setHasApiKey: (hasApiKey) => set({ hasApiKey }),
	initializeStore: async () => {
		console.info("Initializing store");
		const apiKey = await apiKeyService.getApiKey();
		set({ hasApiKey: !!apiKey });

		if (!get().currentConversationId) {
			const newId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
			set({ currentConversationId: newId });
		}
	},
}));
