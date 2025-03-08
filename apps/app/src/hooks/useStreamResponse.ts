import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { Message, Conversation, ChatMode, ChatSettings } from "../types";
import { WebLLMService } from "../lib/web-llm";
import { modelsOptions } from "../lib/models";
import { useError } from "../contexts/ErrorContext";
import { useLoading } from "../contexts/LoadingContext";
import { apiService } from "../lib/api-service";
import { useGenerateTitle } from "./useChat";
import { useAssistantResponse } from "./useAssistantResponse";
import { CHATS_QUERY_KEY } from "../constants";

interface StreamState {
	streamStarted: boolean;
}

interface StreamError extends Error {
	status?: number;
	code?: string;
}

interface UseStreamResponseProps {
	conversationId?: string;
	scrollToBottom: () => void;
	mode: ChatMode;
	model: string;
	chatSettings: ChatSettings;
}

export const useStreamResponse = ({
	conversationId,
	scrollToBottom,
	mode,
	model,
	chatSettings,
}: UseStreamResponseProps) => {
	const queryClient = useQueryClient();
	const generateTitle = useGenerateTitle();
	const { 
		assistantResponseRef, 
		assistantReasoningRef, 
		updateAssistantResponse,
		finalizeAssistantResponse
	} = useAssistantResponse(conversationId);

	const [state, setState] = useState<StreamState>({
		streamStarted: false,
	});

	const { addError } = useError();
	const { startLoading, updateLoading, stopLoading } = useLoading();
	const [controller, setController] = useState(() => new AbortController());
	const webLLMService = useRef<WebLLMService>(WebLLMService.getInstance());
	const aiResponseRef = useRef<string>("");
	const aiReasoningRef = useRef<string>("");

	const matchingModel = modelsOptions.find(
		(modelOption) => model === modelOption.id,
	);

	useEffect(() => {
		const initializeLocalModel = async () => {
			if (mode === "local" && matchingModel?.isLocal) {
				try {
					const loadingId = "model-init";
					startLoading(loadingId, "Initializing local model...");
					await webLLMService.current.init(model, (progress) => {
						const progressPercent = Math.round(progress.progress * 100);
						updateLoading(loadingId, progressPercent, progress.text);
					});
				} catch (error) {
					console.error("Failed to initialize WebLLM:", error);
					addError("Failed to initialize local model. Please try again.");
				} finally {
					stopLoading("model-init");
				}
			}
		};

		initializeLocalModel();
	}, [
		mode,
		model,
		matchingModel?.isLocal,
		startLoading,
		updateLoading,
		stopLoading,
		addError,
	]);

	const updateConversation = (
		content: string,
		reasoning?: string,
		message?: Message,
	) => {
		updateAssistantResponse(content, reasoning, message);
		scrollToBottom();
	};

	const generateResponse = async (
		messages: Message[],
		generateFn: (
			messages: Message[],
			handleProgress: (text: string) => void,
		) => Promise<string>,
	): Promise<string> => {
		let response = "";

		const handleProgress = (text: string) => {
			response += text;
			aiResponseRef.current = response;
			updateConversation(response);
		};

		return await generateFn(messages, handleProgress);
	};

	const handleLocalGeneration = async (
		messages: Message[],
	): Promise<string> => {
		return generateResponse(messages, async (messages, handleProgress) => {
			const lastMessage = messages[messages.length - 1];
			return await webLLMService.current.generate(
				String(conversationId),
				lastMessage.content,
				async (_chatId, content, _model, _mode, role) => {
					if (role !== "user") {
						updateConversation(content);
					}
					return [];
				},
				handleProgress,
			);
		});
	};

	const handleRemoteGeneration = async (
		messages: Message[],
	): Promise<string> => {
		return generateResponse(messages, async (messages) => {
			if (!conversationId) {
				throw new Error("No conversation ID provided");
			}

			try {
				const assistantMessage = await apiService.streamChatCompletions(
					conversationId,
					messages,
					model,
					mode,
					chatSettings,
					controller.signal,
					(text) => {
						aiResponseRef.current = text;
						updateConversation(text);
					}
				);

				if (assistantMessage.reasoning) {
					aiReasoningRef.current = assistantMessage.reasoning.content;
				}

				updateConversation(
					assistantMessage.content,
					assistantMessage.reasoning?.content,
					{
						id: assistantMessage.id,
						created: assistantMessage.created,
						model: assistantMessage.model,
						role: "assistant",
						content: assistantMessage.content,
						citations: assistantMessage.citations,
						usage: assistantMessage.usage,
						logId: assistantMessage.logId,
					}
				);

				if (messages.length <= 2) {
					try {
						const existingConversation = queryClient.getQueryData<Conversation>([CHATS_QUERY_KEY, conversationId]);
						
						if (existingConversation) {
							const updatedConversation: Conversation = {
								...existingConversation,
								messages: [...existingConversation.messages]
							};
							
							const assistantIndex = updatedConversation.messages.findIndex(
								m => m.role === "assistant" && m.id === assistantMessage.id
							);
							
							if (assistantIndex === -1) {
								updatedConversation.messages.push({
									id: assistantMessage.id,
									created: assistantMessage.created,
									model: assistantMessage.model,
									role: "assistant",
									content: assistantMessage.content,
									reasoning: assistantMessage.reasoning,
									citations: assistantMessage.citations,
									usage: assistantMessage.usage,
									logId: assistantMessage.logId,
								});
							}
							
							await apiService.createOrUpdateConversation(updatedConversation);
							
							await generateTitle.mutateAsync({
								chatId: conversationId,
								messages: [...messages, assistantMessage]
							});
						} else {
							console.warn("Cannot generate title: conversation not found in cache");
						}
					} catch (error) {
						console.error("Failed to generate title:", error);
					}
				}

				return assistantMessage.content;
			} catch (error) {
				if (controller.signal.aborted) {
					throw new Error("Request aborted");
				}
				throw error;
			}
		});
	};

	const streamResponse = async (messages: Message[]) => {
		if (!messages.length) {
			addError("No messages provided");
			throw new Error("No messages provided");
		}

		const loadingId = "stream-response";
		startLoading(loadingId, "Generating response...");
		setState((prev) => ({ ...prev, streamStarted: true }));

		try {
			const response =
				mode === "local"
					? await handleLocalGeneration(messages)
					: await handleRemoteGeneration(messages);
			
			await finalizeAssistantResponse();
			
			return response;
		} catch (error) {
			if (controller.signal.aborted) {
				addError("Request aborted", "info");
			} else {
				const streamError = error as StreamError;
				console.error("Error generating response:", streamError);
				addError(streamError.message || "Failed to generate response");
				throw streamError;
			}
		} finally {
			setState((prev) => ({ ...prev, streamStarted: false }));
			stopLoading(loadingId);
			setController(new AbortController());
		}
	};

	return {
		...state,
		controller,
		streamResponse,
		aiResponseRef: assistantResponseRef,
		aiReasoningRef: assistantReasoningRef,
	};
};
