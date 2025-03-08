import { useState } from "react";
import { useChatStore } from "../stores/chatStore";
import { apiService } from "../lib/api-service";

export const useConversation = () => {
	const {
		conversations,
		setConversations,
		currentConversationId,
		setCurrentConversationId,
		fetchConversations,
	} = useChatStore();

	const [isDeleting, setIsDeleting] = useState(false);

	const deleteConversation = async (id: string, showPromptToUser = true) => {
		try {
			if (
				showPromptToUser &&
				!window.confirm("Are you sure you want to delete this conversation?")
			) {
				return;
			}

			setIsDeleting(true);

			await apiService.deleteConversation(id);

			setConversations((prev) => {
				const filtered = prev.filter((conv) => conv.id !== id);
				return filtered;
			});

			if (currentConversationId === id) {
				const firstConversation = conversations.find((c) => c.id !== id);
				setCurrentConversationId(firstConversation?.id ? String(firstConversation.id) : undefined);
			}
		} catch (error) {
			console.error("Failed to delete conversation:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const deleteUnusedConversations = async () => {
		try {
			await fetchConversations();
			
			const unusedConversations = conversations.filter(
				(conversation) => conversation.messages.length === 0,
			);

			for (const conversation of unusedConversations) {
				if (!conversation.id) continue;
				await deleteConversation(String(conversation.id), false);
			}
		} catch (error) {
			console.error("Failed to delete unused conversations:", error);
		}
	};

	const editConversationTitle = async (id: string, newTitle: string) => {
		try {
			setConversations((prev) => {
				return prev.map((conv) => {
					if (conv.id === id) {
						return { ...conv, title: newTitle };
					}
					return conv;
				});
			});

			await apiService.updateConversationTitle(id, newTitle);
		} catch (error) {
			console.error("Failed to edit conversation title:", error);
			
			await fetchConversations();
		}
	};

	return {
		deleteConversation,
		deleteUnusedConversations,
		editConversationTitle,
		isDeleting,
	};
};
