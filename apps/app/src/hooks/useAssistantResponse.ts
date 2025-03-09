import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import type { Message, Conversation } from "../types";
import { CHATS_QUERY_KEY } from "../constants";

export function useAssistantResponse(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const assistantResponseRef = useRef<string>("");
  const assistantReasoningRef = useRef<string>("");

  const updateAssistantResponse = (
    content: string,
    reasoning?: string,
    message?: Message
  ) => {
    if (!conversationId) return;

    assistantResponseRef.current = content;
    if (reasoning) {
      assistantReasoningRef.current = reasoning;
    }

    queryClient.setQueryData(
      [CHATS_QUERY_KEY, conversationId],
      (oldData: Conversation | undefined) => {
        if (!oldData) {
          return {
            id: conversationId,
            title: `${content.slice(0, 20)}...`,
            messages: [{
              role: "assistant",
              content: content,
              id: crypto.randomUUID(),
              created: Date.now(),
              model: message?.model || "",
              reasoning: reasoning
                ? {
                    collapsed: true,
                    content: reasoning,
                  }
                : undefined,
            }]
          };
        }

        const updatedConversation = JSON.parse(JSON.stringify(oldData));
        const lastMessageIndex = updatedConversation.messages.length - 1;

        if (
          lastMessageIndex === -1 ||
          updatedConversation.messages[lastMessageIndex].role !== "assistant"
        ) {
          updatedConversation.messages.push({
            role: "assistant",
            content: "",
            id: crypto.randomUUID(),
            created: Date.now(),
            model: message?.model || "",
          });
        }

        const lastMessage =
          updatedConversation.messages[updatedConversation.messages.length - 1];

        if (message) {
          updatedConversation.messages[updatedConversation.messages.length - 1] = {
            ...message,
            role: "assistant",
            content: content,
            reasoning: reasoning
              ? {
                  collapsed: true,
                  content: reasoning,
                }
              : undefined,
          };
        } else {
          lastMessage.content = content;

          if (reasoning) {
            lastMessage.reasoning = {
              collapsed: true,
              content: reasoning,
            };
          }
        }

        return updatedConversation;
      }
    );

    queryClient.setQueryData(
      [CHATS_QUERY_KEY],
      (oldData: Conversation[] | undefined) => {
        if (!oldData) {
          const conversation = queryClient.getQueryData([CHATS_QUERY_KEY, conversationId]) as Conversation;
          return conversation ? [conversation] : [];
        }

        const updatedConversation = queryClient.getQueryData(
          [CHATS_QUERY_KEY, conversationId]
        ) as Conversation;
        
        if (!updatedConversation) return oldData;

        const existingIndex = oldData.findIndex(conv => conv.id === conversationId);
        
        if (existingIndex >= 0) {
          const newData = [...oldData];
          newData[existingIndex] = updatedConversation;
          return newData;
        } else {
          return [updatedConversation, ...oldData];
        }
      }
    );
  };

  const finalizeAssistantResponse = async () => {
    if (!conversationId) return;
    
    try {
      const conversation = queryClient.getQueryData<Conversation>([CHATS_QUERY_KEY, conversationId]);
      
      if (conversation) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY], exact: true });
          queryClient.invalidateQueries({ queryKey: [CHATS_QUERY_KEY, conversationId] });
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to finalize assistant response:", error);
    }
  };

  return {
    assistantResponseRef,
    assistantReasoningRef,
    updateAssistantResponse,
    finalizeAssistantResponse,
  };
} 