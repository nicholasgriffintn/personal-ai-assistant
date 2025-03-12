import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { CHATS_QUERY_KEY } from "../constants";
import { apiService } from "../lib/api-service";
import { localChatService } from "../lib/local-chat-service";
import { useChatStore } from "../stores/chatStore";
import type { Conversation, Message } from "../types";

export function useChats() {
	const { isAuthenticated, isPro, localOnlyMode } = useChatStore();

	const remoteChatsQuery = useQuery({
		queryKey: [CHATS_QUERY_KEY, "remote"],
		queryFn: () => apiService.listChats(),
		enabled: isAuthenticated && isPro && !localOnlyMode,
	});

	const localChatsQuery = useQuery({
		queryKey: [CHATS_QUERY_KEY, "local"],
		queryFn: async () => await localChatService.listLocalChats(),
	});

	const allChats = useMemo(() => {
		const remoteChats = remoteChatsQuery.data || [];
		const localChats = localChatsQuery.data || [];

		if (localOnlyMode || !isAuthenticated) {
			return localChats;
		}

		const remoteIds = new Set(remoteChats.map((chat) => chat.id));
		const uniqueLocalChats = localChats.filter(
			(chat) => !remoteIds.has(chat.id),
		);

		return [...remoteChats, ...uniqueLocalChats];
	}, [
		remoteChatsQuery.data,
		localChatsQuery.data,
		localOnlyMode,
		isAuthenticated,
	]);

	return {
		data: allChats,
		isLoading: remoteChatsQuery.isLoading || localChatsQuery.isLoading,
	};
}

export function useLocalChats() {
	return useQuery({
		queryKey: [CHATS_QUERY_KEY, "local"],
		queryFn: async () => await localChatService.listLocalChats(),
	});
}

export function useChat(completion_id: string | undefined) {
	const { isAuthenticated, isPro, localOnlyMode } = useChatStore();

	const localChatQuery = useQuery({
		queryKey: [CHATS_QUERY_KEY, "local", completion_id],
		queryFn: async () =>
			completion_id ? await localChatService.getLocalChat(completion_id) : null,
		enabled: !!completion_id,
	});

	const remoteChatQuery = useQuery({
		queryKey: [CHATS_QUERY_KEY, completion_id],
		queryFn: async () =>
			completion_id ? await apiService.getChat(completion_id) : null,
		enabled: !!completion_id && isAuthenticated && isPro && !localOnlyMode,
	});

	const data = useMemo(() => {
		if (localOnlyMode) {
			return localChatQuery.data;
		}

		return remoteChatQuery.data || localChatQuery.data;
	}, [localChatQuery.data, remoteChatQuery.data, localOnlyMode]);

	return {
		data,
		isLoading:
			localChatQuery.isLoading ||
			(remoteChatQuery.isLoading && isAuthenticated && !localOnlyMode),
	};
}

export function useDeleteChat() {
	const queryClient = useQueryClient();
	const { isAuthenticated, isPro, localOnlyMode } = useChatStore();

	return useMutation({
		mutationFn: async (completion_id: string) => {
			await localChatService.deleteLocalChat(completion_id);

			if (isAuthenticated && isPro && !localOnlyMode) {
				await apiService.deleteConversation(completion_id);
			}
		},
		onSuccess: (_, completion_id) => {
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, "local"] });
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, "remote"] });
			queryClient.invalidateQueries({
				queryKey: [CHATS_QUERY_KEY, completion_id],
			});
			queryClient.invalidateQueries({
				queryKey: [CHATS_QUERY_KEY, "local", completion_id],
			});
		},
	});
}

export function useDeleteAllChats() {
	const queryClient = useQueryClient();
	const { setCurrentConversationId } = useChatStore();

	return useMutation({
		mutationFn: async () => {
			await localChatService.deleteAllLocalChats();
		},
		onSuccess: () => {
			setCurrentConversationId(undefined);

			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, "local"] });
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, "remote"] });
		},
	});
}

export function useUpdateChatTitle() {
	const queryClient = useQueryClient();
	const { isAuthenticated, isPro, localOnlyMode } = useChatStore();

	return useMutation({
		mutationFn: async ({
			completion_id,
			title,
		}: { completion_id: string; title: string }) => {
			await localChatService.updateLocalChatTitle(completion_id, title);

			if (isAuthenticated && isPro && !localOnlyMode) {
				await apiService.updateConversationTitle(completion_id, title);
			}
		},
		onSuccess: (_, { completion_id }) => {
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, "local"] });
			queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, "remote"] });
			queryClient.invalidateQueries({
				queryKey: [CHATS_QUERY_KEY, completion_id],
			});
			queryClient.invalidateQueries({
				queryKey: [CHATS_QUERY_KEY, "local", completion_id],
			});
		},
	});
}

export function useGenerateTitle() {
	const queryClient = useQueryClient();
	const { isAuthenticated, isPro, localOnlyMode } = useChatStore();

	return useMutation({
		mutationFn: async ({
			completion_id,
			messages,
		}: { completion_id: string; messages: Message[] }) =>
			await apiService.generateTitle(completion_id, messages),
		onSuccess: async (newTitle, { completion_id }) => {
			const existingConversation = queryClient.getQueryData<Conversation>([
				CHATS_QUERY_KEY,
				completion_id,
			]);

			const existingMessages = existingConversation?.messages || [];

			queryClient.setQueryData(
				[CHATS_QUERY_KEY, completion_id],
				(oldData: Conversation | undefined) => {
					if (!oldData) return oldData;
					return {
						...oldData,
						title: newTitle,
						messages:
							existingMessages.length > 0 ? existingMessages : oldData.messages,
					};
				},
			);

			queryClient.setQueryData(
				[CHATS_QUERY_KEY],
				(oldData: Conversation[] | undefined) => {
					if (!oldData) return oldData;
					return oldData.map((conv) => {
						if (conv.id === completion_id) {
							return {
								...conv,
								title: newTitle,
								messages:
									existingMessages.length > 0
										? existingMessages
										: conv.messages,
							};
						}
						return conv;
					});
				},
			);

			const shouldSaveLocally = !isAuthenticated || !isPro || localOnlyMode;
			if (shouldSaveLocally) {
				const conversation = queryClient.getQueryData<Conversation>([
					CHATS_QUERY_KEY,
					completion_id,
				]);
				if (conversation) {
					await localChatService.updateLocalChatTitle(completion_id, newTitle);
				}
			} else {
				const localConversation =
					await localChatService.getLocalChat(completion_id);
				if (localConversation) {
					await localChatService.updateLocalChatTitle(completion_id, newTitle);
				}
			}

			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
				queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, "local"] });
				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY, "remote"],
				});
				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY, completion_id],
				});
				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY, "local", completion_id],
				});
			}, 1000);
		},
	});
}

export function useSubmitFeedback() {
	return useMutation({
		mutationFn: ({
			completion_id,
			logId,
			feedback,
			score = 50,
		}: {
			completion_id: string;
			logId: string;
			feedback: 1 | -1;
			score?: number;
		}) => apiService.submitFeedback(completion_id, logId, feedback, score),
	});
}
