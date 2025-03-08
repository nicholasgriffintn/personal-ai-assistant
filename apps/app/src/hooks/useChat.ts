import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../lib/api-service';
import type { Conversation, Message } from '../types';

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
    onSuccess: (newTitle, { chatId }) => {
      queryClient.setQueryData(
        [CHATS_QUERY_KEY, chatId],
        (oldData: Conversation | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            title: newTitle
          };
        }
      );

      queryClient.setQueryData(
        [CHATS_QUERY_KEY],
        (oldData: Conversation[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(conv => {
            if (conv.id === chatId) {
              return {
                ...conv,
                title: newTitle
              };
            }
            return conv;
          });
        }
      );

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, chatId] });
      }, 1000);
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

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      message, 
      allMessages 
    }: { 
      conversationId: string; 
      message: Message; 
      allMessages: Message[] 
    }) => {
      const conversation: Conversation = {
        id: conversationId,
        title: "New conversation",
        messages: allMessages
      };
      
      await apiService.createOrUpdateConversation(conversation);
      
      return { conversationId, message };
    },
    onMutate: async ({ conversationId, message, allMessages }) => {
      await queryClient.cancelQueries({ queryKey: [CHATS_QUERY_KEY] });
      await queryClient.cancelQueries({ queryKey: [CHATS_QUERY_KEY, conversationId] });

      const previousChats = queryClient.getQueryData<Conversation[]>([CHATS_QUERY_KEY]);
      const previousConversation = queryClient.getQueryData<Conversation>([CHATS_QUERY_KEY, conversationId]);

      if (previousConversation) {
        queryClient.setQueryData<Conversation>([CHATS_QUERY_KEY, conversationId], old => {
          if (!old) return {
            id: conversationId,
            title: "New conversation",
            messages: [message]
          };
          
          return {
            ...old,
            messages: [...old.messages, message]
          };
        });
      } else {
        queryClient.setQueryData<Conversation>([CHATS_QUERY_KEY, conversationId], {
          id: conversationId,
          title: "New conversation",
          messages: [message]
        });
      }

      queryClient.setQueryData<Conversation[]>([CHATS_QUERY_KEY], old => {
        if (!old) return [{
          id: conversationId,
          title: "New conversation",
          messages: [message]
        }];
        
        const existingConversation = old.find(c => c.id === conversationId);
        
        if (existingConversation) {
          return old.map(c => {
            if (c.id === conversationId) {
              return {
                ...c,
                messages: [...c.messages, message]
              };
            }
            return c;
          });
        } else {
          return [
            {
              id: conversationId,
              title: "New conversation",
              messages: [message]
            },
            ...old
          ];
        }
      });

      return { previousChats, previousConversation };
    },
    onError: (err, variables, context) => {
      console.error(err);
      if (context?.previousConversation) {
        queryClient.setQueryData([CHATS_QUERY_KEY, variables.conversationId], context.previousConversation);
      }
      if (context?.previousChats) {
        queryClient.setQueryData([CHATS_QUERY_KEY], context.previousChats);
      }
    },
    onSettled: () => {
    }
  });
} 