import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../lib/api-service';
import type { Conversation, Message } from '../types';
import { CHATS_QUERY_KEY } from '../constants';

export function useChats() {
  return useQuery({
    queryKey: [CHATS_QUERY_KEY],
    queryFn: () => apiService.listChats(),
  });
}

export function useChat(completion_id: string | undefined) {
  return useQuery({
    queryKey: [CHATS_QUERY_KEY, completion_id],
    queryFn: () => (completion_id ? apiService.getChat(completion_id) : null),
    enabled: !!completion_id,
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (completion_id: string) => apiService.deleteConversation(completion_id),
    onSuccess: (_, completion_id) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, completion_id] });
    },
  });
}

export function useUpdateChatTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ completion_id, title }: { completion_id: string; title: string }) =>
      apiService.updateConversationTitle(completion_id, title),
    onSuccess: (_, { completion_id }) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, completion_id] });
    },
  });
}

export function useGenerateTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ completion_id, messages }: { completion_id: string; messages: Message[] }) =>
      apiService.generateTitle(completion_id, messages),
    onSuccess: (newTitle, { completion_id }) => {
      queryClient.setQueryData(
        [CHATS_QUERY_KEY, completion_id],
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
            if (conv.id === completion_id) {
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
        queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, completion_id] });
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

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      message,
    }: { 
      conversationId: string; 
      message: Message;
    }) => {
      return { conversationId, message };
    },
    onMutate: async ({ conversationId, message }) => {
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