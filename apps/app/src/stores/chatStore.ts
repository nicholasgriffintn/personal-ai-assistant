import { create } from "zustand";

import { apiKeyService } from "../lib/api-key";

export interface ChatStore {
	currentConversationId: string | undefined;
	setCurrentConversationId: (id: string | undefined) => void;
	isMobile: boolean;
	setIsMobile: (isMobile: boolean) => void;
	sidebarVisible: boolean;
	setSidebarVisible: (visible: boolean) => void;
	startNewConversation: () => void;
	hasApiKey: boolean;
	setHasApiKey: (hasApiKey: boolean) => void;
	isAuthenticated: boolean;
	setIsAuthenticated: (isAuthenticated: boolean) => void;
	isPro: boolean;
	setIsPro: (isPro: boolean) => void;
	localOnlyMode: boolean;
	setLocalOnlyMode: (localOnly: boolean) => void;
	initializeStore: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
	currentConversationId: undefined,
	setCurrentConversationId: (id) => set({ currentConversationId: id }),
	isMobile: false,
	setIsMobile: (isMobile) => set({ isMobile }),
	sidebarVisible: true,
	setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
	startNewConversation: () => {
		const newId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		set({ currentConversationId: newId });
	},
	hasApiKey: false,
	setHasApiKey: (hasApiKey) => set({ hasApiKey }),
	isAuthenticated: false,
	setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
	isPro: false,
	setIsPro: (isPro) => set({ isPro }),
	localOnlyMode: false,
	setLocalOnlyMode: (localOnly) => set({ localOnlyMode: localOnly }),
	initializeStore: async () => {
		console.info("Initializing store");

		const apiKey = await apiKeyService.getApiKey();
		set({ hasApiKey: !!apiKey });

		const localOnlyMode = localStorage.getItem("localOnlyMode") === "true";
		set({ localOnlyMode });

		if (!get().currentConversationId) {
			const newId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
			set({ currentConversationId: newId });
		}
	},
}));
