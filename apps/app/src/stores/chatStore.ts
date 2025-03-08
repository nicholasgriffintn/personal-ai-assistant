import { create } from "zustand";
import type { IDBPDatabase } from "idb";

import type { Conversation } from "../types";
import { storeName } from "../constants";

export interface ChatStore {
	conversations: Conversation[];
	setConversations: (
		conversations: Conversation[] | ((prev: Conversation[]) => Conversation[]),
	) => void;
	currentConversationId: number | undefined;
	setCurrentConversationId: (id: number | undefined) => void;
	sidebarVisible: boolean;
	setSidebarVisible: (visible: boolean) => void;
	startNewConversation: () => void;
	initializeStore: () => Promise<void>;
	db: IDBPDatabase<unknown> | null;
	setDB: (db: IDBPDatabase<unknown> | null) => void;
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
	initializeStore: async () => {
		const { db, setConversations } = get();
		if (!db) return;

		try {
			const allConversations = await db.getAll(storeName);
			const sortedConversations = allConversations.reverse();
			setConversations(sortedConversations);
		} catch (error) {
			console.error("Failed to initialize store:", error);
		}
	},
}));
