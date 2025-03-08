import { create } from "zustand";
import type { IDBPDatabase } from "idb";

import type { Conversation } from "../types";
import { storeName } from "../constants";
import { apiKeyService } from "../lib/api-key";

export interface ChatStore {
	conversations: Conversation[];
	setConversations: (
		conversations: Conversation[] | ((prev: Conversation[]) => Conversation[]),
	) => void;
	currentConversationId: number | IDBValidKey | undefined;
	setCurrentConversationId: (id: number | IDBValidKey | undefined) => void;
	sidebarVisible: boolean;
	setSidebarVisible: (visible: boolean) => void;
	startNewConversation: () => void;
	db: IDBPDatabase<unknown> | null;
	setDB: (db: IDBPDatabase<unknown> | null) => void;
	hasApiKey: boolean;
	setHasApiKey: (hasApiKey: boolean) => void;
	initializeStore: () => Promise<void>;
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
		const newId = Date.now() + Math.floor(Math.random() * 1000);
		set({ currentConversationId: newId });
	},
	db: null,
	setDB: (db) => set({ db }),
	hasApiKey: false,
	setHasApiKey: (hasApiKey) => set({ hasApiKey }),
	initializeStore: async () => {
		console.info("Initializing store");
		const apiKey = await apiKeyService.getApiKey();
		set({ hasApiKey: !!apiKey });

		const { db, setConversations } = get();
		if (!db) return;

		try {
			const allConversations = await db.getAll(storeName);
			const sortedConversations = allConversations.reverse();
			setConversations(sortedConversations);

			if (!get().currentConversationId) {
				const newId = Date.now() + Math.floor(Math.random() * 1000);
				set({ currentConversationId: newId });
			}
		} catch (error) {
			console.error("Failed to initialize store:", error);
		}
	},
}));
