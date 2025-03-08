import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../lib/api-service';
import type { Message, ChatMode, ChatSettings } from '../types';

const CHATS_QUERY_KEY = 'chats';

export function useChats() {
  return useQuery({
    queryKey: [CHATS_QUERY_KEY],
    queryFn: () => apiService.listChats(),
  });
}

export function useChat(chatId: string | undefined) {
  return useQuery({
    queryKey: [CHATS_QUERY_KEY, chatId],
    queryFn: () => (chatId ? apiService.getChat(chatId) : null),
    enabled: !!chatId,
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      message,
      model,
      mode,
      chatSettings,
    }: {
      chatId: string;
      message: Message;
      model: string;
      mode: ChatMode;
      chatSettings: ChatSettings;
    }) => {
      return apiService.createChat(chatId, message, model, mode, chatSettings);
    },
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, chatId] });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => apiService.deleteConversation(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, chatId] });
    },
  });
}

export function useUpdateChatTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      apiService.updateConversationTitle(chatId, title),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, chatId] });
    },
  });
}

export function useGenerateTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, messages }: { chatId: string; messages: Message[] }) =>
      apiService.generateTitle(chatId, messages),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, chatId] });
    },
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: ({
      logId,
      feedback,
      score = 50,
    }: {
      logId: string;
      feedback: 1 | -1;
      score?: number;
    }) => apiService.submitFeedback(logId, feedback, score),
  });
} 