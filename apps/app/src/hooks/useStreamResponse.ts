import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { CHATS_QUERY_KEY } from "../constants";
import { apiService } from "../lib/api-service";
import { localChatService } from "../lib/local-chat-service";
import { webLLMModels } from "../lib/models";
import { WebLLMService } from "../lib/web-llm";
import { useError } from "../state/contexts/ErrorContext";
import { useLoading } from "../state/contexts/LoadingContext";
import { useChatStore } from "../state/stores/chatStore";
import type { ChatMode, ChatSettings, Conversation, Message } from "../types";
import { useAssistantResponse } from "./useAssistantResponse";
import { useGenerateTitle } from "./useChat";
import { useModels } from "./useModels";

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
	onModelInitError?: (model: string) => void;
}

export const useStreamResponse = ({
	conversationId,
	// @ts-ignore
	scrollToBottom,
	mode,
	model,
	chatSettings,
	onModelInitError,
}: UseStreamResponseProps) => {
	const queryClient = useQueryClient();
	const generateTitle = useGenerateTitle();
	const { data: apiModels = {} } = useModels();
	const {
		assistantResponseRef,
		assistantReasoningRef,
		updateAssistantResponse,
		finalizeAssistantResponse,
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
	const initializingRef = useRef<boolean>(false);

	const matchingModel =
		mode === "local" ? webLLMModels[model] : apiModels[model];

	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to initialize the model when the model changes
	useEffect(() => {
		const loadingId = "model-init";
		let mounted = true;

		const initializeLocalModel = async () => {
			if (!mounted || initializingRef.current) return;

			if (mode === "local" && matchingModel?.provider === "web-llm") {
				try {
					initializingRef.current = true;
					startLoading(loadingId, "Initializing local model...");

					await webLLMService.current.init(model, (progress) => {
						if (!mounted) return;
						console.log("web-llm progress", progress);
						const progressPercent = Math.round(progress.progress * 100);
						updateLoading(loadingId, progressPercent, progress.text);
					});
				} catch (error) {
					console.error("Failed to initialize WebLLM:", error);
					if (mounted) {
						addError("Failed to initialize local model. Please try again.");
						onModelInitError?.(model);
					}
				} finally {
					if (mounted) {
						stopLoading(loadingId);
						initializingRef.current = false;
					}
				}
			}
		};

		initializeLocalModel();

		return () => {
			mounted = false;
			stopLoading(loadingId);
		};
	}, [mode, model, matchingModel?.provider]);

	const updateConversation = async (
		content: string,
		reasoning?: string,
		message?: Message,
	) => {
		updateAssistantResponse(content, reasoning, message);

		if (conversationId) {
			const { isAuthenticated, isPro, localOnlyMode } = useChatStore.getState();
			const shouldSaveLocally =
				!isAuthenticated ||
				!isPro ||
				localOnlyMode ||
				chatSettings.localOnly === true ||
				mode === "local";

			if (shouldSaveLocally) {
				const conversation = queryClient.getQueryData<Conversation>([
					CHATS_QUERY_KEY,
					conversationId,
				]);

				if (conversation) {
					const localConversation: Conversation = {
						...conversation,
						isLocalOnly: true,
					};
					await localChatService.saveLocalChat(localConversation);
				}
			}

			// TODO: Uncomment this when it's better, needs to only scroll to the bottom if the user has not scrolled themselves.
			// scrollToBottom();
		}
	};

	const generateResponse = async (
		messages: Message[],
		generateFn: (
			messages: Message[],
			handleProgress: (text: string) => void,
		) => Promise<string>,
	): Promise<string> => {
		setState({ streamStarted: true });
		startLoading("new-response", "Generating response...");

		let response = "";

		const handleProgress = (text: string) => {
			response += text;
			aiResponseRef.current = response;
			updateConversation(response);
		};

		try {
			const result = await generateFn(messages, handleProgress);
			finalizeAssistantResponse();
			return result;
		} catch (error) {
			console.error("Error generating response:", error);
			const streamError = error as StreamError;

			if (streamError.status === 429) {
				addError("Rate limit exceeded. Please try again later.");
			} else if (streamError.code === "model_not_found") {
				addError(`Model not found: ${model}`);
				if (onModelInitError) {
					onModelInitError(model);
				}
			} else {
				addError(streamError.message || "Failed to generate response");
			}

			throw error;
		} finally {
			setState({ streamStarted: false });
			stopLoading("new-response");
		}
	};

	const handleLocalGeneration = async (
		messages: Message[],
	): Promise<string> => {
		return generateResponse(messages, async (messages, handleProgress) => {
			const lastMessage = messages[messages.length - 1];
			const lastMessageContent =
				typeof lastMessage.content === "string"
					? lastMessage.content
					: lastMessage.content.map((item) => item.text).join("");

			return await webLLMService.current.generate(
				String(conversationId),
				lastMessageContent,
				async (_chatId, content, _model, _mode, role) => {
					if (role !== "user") {
						await updateConversation(content);

						if (conversationId) {
							const conversation = queryClient.getQueryData<Conversation>([
								CHATS_QUERY_KEY,
								conversationId,
							]);
							if (conversation) {
								queryClient.setQueryData<Conversation>(
									[CHATS_QUERY_KEY, conversationId],
									{
										...conversation,
										isLocalOnly: true,
									},
								);
							}
						}
					}
					return [];
				},
				handleProgress,
			);
		}).then(async (result) => {
			if (messages.length <= 2 && conversationId) {
				try {
					const existingConversation = queryClient.getQueryData<Conversation>([
						CHATS_QUERY_KEY,
						conversationId,
					]);

					if (existingConversation) {
						const assistantMessage: Message = {
							id: crypto.randomUUID(),
							created: Date.now(),
							model: model,
							role: "assistant",
							content: aiResponseRef.current,
						};

						await generateTitle.mutateAsync({
							completion_id: conversationId,
							messages: [...messages, assistantMessage],
						});

						const updatedConversation = queryClient.getQueryData<Conversation>([
							CHATS_QUERY_KEY,
							conversationId,
						]);
						if (updatedConversation) {
							await localChatService.saveLocalChat({
								...updatedConversation,
								isLocalOnly: true,
							});
						}
					} else {
						console.warn(
							"Cannot generate title: conversation not found in cache",
						);
					}
				} catch (error) {
					console.error("Failed to generate title for local model:", error);
				}
			}
			return result;
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
				const { isAuthenticated, isPro, localOnlyMode } =
					useChatStore.getState();
				const shouldStore =
					isAuthenticated && isPro && !localOnlyMode && !chatSettings.localOnly;

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
					},
					shouldStore,
				);

				if (assistantMessage.reasoning) {
					aiReasoningRef.current = assistantMessage.reasoning.content;
				}

				const messageContent =
					typeof assistantMessage.content === "string"
						? assistantMessage.content
						: assistantMessage.content.map((item) => item.text).join("");

				await updateConversation(
					messageContent,
					assistantMessage.reasoning?.content,
					{
						id: assistantMessage.id,
						created: assistantMessage.created,
						model: assistantMessage.model,
						role: "assistant",
						content: messageContent,
						citations: assistantMessage.citations,
						usage: assistantMessage.usage,
						logId: assistantMessage.logId,
					},
				);

				if (messages.length <= 2) {
					try {
						const existingConversation = queryClient.getQueryData<Conversation>(
							[CHATS_QUERY_KEY, conversationId],
						);

						if (existingConversation) {
							await generateTitle.mutateAsync({
								completion_id: conversationId,
								messages: [...messages, assistantMessage],
							});
						} else {
							console.warn(
								"Cannot generate title: conversation not found in cache",
							);
						}
					} catch (error) {
						console.error("Failed to generate title:", error);
					}
				}

				return messageContent;
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

			if (mode === "local" && conversationId) {
				const conversation = queryClient.getQueryData<Conversation>([
					CHATS_QUERY_KEY,
					conversationId,
				]);
				if (conversation) {
					queryClient.setQueryData<Conversation>(
						[CHATS_QUERY_KEY, conversationId],
						{
							...conversation,
							isLocalOnly: true,
						},
					);

					await localChatService.saveLocalChat({
						...conversation,
						isLocalOnly: true,
					});
				}
			}

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
