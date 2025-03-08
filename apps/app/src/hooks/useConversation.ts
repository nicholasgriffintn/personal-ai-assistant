import { storeName } from "../constants";
import { Conversation } from "../types";
import { useChatStore } from "../stores/chatStore";

export const useConversation = () => {
	const {
		conversations,
		setConversations,
		currentConversationId,
		setCurrentConversationId,
		db,
	} = useChatStore();

	const deleteConversation = async (id: number, showPromptToUser = true) => {
		try {
			if (
				showPromptToUser &&
				!window.confirm("Are you sure you want to delete this conversation?")
			) {
				return;
			}

			await db?.delete(storeName, id);

			setConversations((prev) => {
				const filtered = prev.filter((conv) => conv.id !== id);
				return filtered;
			});

			if (currentConversationId === id) {
				const firstConversation = conversations.find((c) => c.id !== id);
				setCurrentConversationId(firstConversation?.id);
			}
		} catch (error) {
			console.error("Failed to delete conversation:", error);
		}
	};

	const deleteUnusedConversations = async () => {
		if (!db) {
			return;
		}

		const conversations = (await db.getAll(storeName)) as Conversation[];
		const unusedConversations = conversations.filter(
			(conversation) => conversation.messages.length === 0,
		);

		for (const conversation of unusedConversations) {
			deleteConversation(conversation.id as number, false);
		}
	};

	const editConversationTitle = async (id: number, newTitle: string) => {
		try {
			const conversation = (await db?.get(storeName, id)) as Conversation;
			if (!conversation) return;

			conversation.title = newTitle;
			await db?.put(storeName, conversation);

			setConversations((prev) => {
				return prev.map((conv) => {
					if (conv.id === id) {
						return { ...conv, title: newTitle };
					}
					return conv;
				});
			});
		} catch (error) {
			console.error("Failed to edit conversation title:", error);
		}
	};

	return {
		deleteConversation,
		editConversationTitle,
		deleteUnusedConversations,
	};
};
