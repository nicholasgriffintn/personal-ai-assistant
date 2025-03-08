import { create } from "zustand";
import type { Conversation } from "../types";
import { apiKeyService } from "../lib/api-key";
import { apiService } from "../lib/api-service";

export interface ChatStore {
	conversations: Conversation[];
	setConversations: (
		conversations: Conversation[] | ((prev: Conversation[]) => Conversation[]),
	) => void;
	currentConversationId: string | undefined;
	setCurrentConversationId: (id: string | undefined) => void;
	sidebarVisible: boolean;
	setSidebarVisible: (visible: boolean) => void;
	startNewConversation: () => void;
	hasApiKey: boolean;
	setHasApiKey: (hasApiKey: boolean) => void;
	initializeStore: () => Promise<void>;
	fetchConversations: () => Promise<void>;
	fetchConversation: (id: string) => Promise<Conversation | undefined>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
	conversations: [],
	setConversations: (conversations) =>
		set((state) => ({
			conversations:
				typeof conversations === "function"
					? conversations(state.conversations)
					: conversations,
		})),
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

		try {
			await get().fetchConversations();
			
			if (!get().currentConversationId) {
				const newId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
				set({ currentConversationId: newId });
			}
		} catch (error) {
			console.error("Failed to initialize store:", error);
		}
	},
	fetchConversations: async () => {
		try {
			const conversations = await apiService.listChats();
			set({ conversations });
		} catch (error) {
			console.error("Failed to fetch conversations:", error);
			throw error;
		}
	},
	fetchConversation: async (id) => {
		try {
			const conversation = await apiService.getChat(id);
			
			set((state) => {
				const existingIndex = state.conversations.findIndex(c => c.id === id);
				
				if (existingIndex >= 0) {
					const updatedConversations = [...state.conversations];
					updatedConversations[existingIndex] = conversation;
					return { conversations: updatedConversations };
				} else {
					return { conversations: [conversation, ...state.conversations] };
				}
			});
			
			return conversation;
		} catch (error) {
			console.error(`Failed to fetch conversation ${id}:`, error);
			return undefined;
		}
	},
}));
