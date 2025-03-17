import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { CHATS_QUERY_KEY } from "~/constants";
import { apiService } from "~/lib/api-service";
import { localChatService } from "~/lib/local-chat-service";
import { webLLMModels } from "~/lib/models";
import { WebLLMService } from "~/lib/web-llm";
import { useError } from "~/state/contexts/ErrorContext";
import { useLoading } from "~/state/contexts/LoadingContext";
import { useChatStore } from "~/state/stores/chatStore";
import type { Conversation, Message } from "~/types";
import { useGenerateTitle } from "./useChat";
import { useModels } from "./useModels";

export function useChatManager() {
	const queryClient = useQueryClient();
	const generateTitle = useGenerateTitle();
	const { data: apiModels = {} } = useModels();
	const { addError } = useError();
	const { startLoading, updateLoading, stopLoading } = useLoading();

	const {
		currentConversationId,
		startNewConversation,
		chatMode,
		model,
		chatSettings,
		isAuthenticated,
		isPro,
		localOnlyMode,
		setModel,
	} = useChatStore();

	const [streamStarted, setStreamStarted] = useState(false);
	const [controller, setController] = useState(() => new AbortController());

	const webLLMService = useRef<WebLLMService>(WebLLMService.getInstance());
	const assistantResponseRef = useRef<string>("");
	const assistantReasoningRef = useRef<string>("");
	const initializingRef = useRef<boolean>(false);

	const matchingModel =
		chatMode === "local" ? webLLMModels[model] : apiModels[model];

	useEffect(() => {
		const loadingId = "model-init";
		let mounted = true;

		const initializeLocalModel = async () => {
			if (!mounted || initializingRef.current) return;

			if (chatMode === "local" && matchingModel?.provider === "web-llm") {
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
						setModel("");
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
	}, [
		chatMode,
		model,
		matchingModel?.provider,
		startLoading,
		updateLoading,
		stopLoading,
		addError,
		setModel,
	]);

	const determineStorageMode = useCallback(() => {
		const isLocalOnly =
			!isAuthenticated ||
			!isPro ||
			localOnlyMode ||
			chatSettings.localOnly === true ||
			chatMode === "local";

		return {
			isLocalOnly,
			shouldSyncRemote: !isLocalOnly,
		};
	}, [isAuthenticated, isPro, localOnlyMode, chatSettings.localOnly, chatMode]);

	const updateConversation = useCallback(
		async (
			conversationId: string,
			updater: (conversation: Conversation | undefined) => Conversation,
		) => {
			const { isLocalOnly } = determineStorageMode();

			const currentConversation = queryClient.getQueryData<Conversation>([
				CHATS_QUERY_KEY,
				conversationId,
			]);
			const allConversations =
				queryClient.getQueryData<Conversation[]>([CHATS_QUERY_KEY]) || [];

			const updatedConversation = {
				...updater(currentConversation),
				isLocalOnly: updater(currentConversation)?.isLocalOnly || isLocalOnly,
			};

			queryClient.setQueryData(
				[CHATS_QUERY_KEY, conversationId],
				updatedConversation,
			);

			const existingIndex = allConversations.findIndex(
				(c) => c.id === conversationId,
			);
			const updatedAllConversations = [...allConversations];

			if (existingIndex >= 0) {
				updatedAllConversations[existingIndex] = updatedConversation;
			} else {
				updatedAllConversations.unshift(updatedConversation);
			}

			queryClient.setQueryData([CHATS_QUERY_KEY], updatedAllConversations);

			if (isLocalOnly) {
				const localChats =
					queryClient.getQueryData<Conversation[]>([
						CHATS_QUERY_KEY,
						"local",
					]) || [];

				const localExistingIndex = localChats.findIndex(
					(c) => c.id === conversationId,
				);
				const updatedLocalChats = [...localChats];

				if (localExistingIndex >= 0) {
					updatedLocalChats[localExistingIndex] = updatedConversation;
				} else {
					updatedLocalChats.unshift(updatedConversation);
				}

				queryClient.setQueryData([CHATS_QUERY_KEY, "local"], updatedLocalChats);
			} else {
				const remoteChats =
					queryClient.getQueryData<Conversation[]>([
						CHATS_QUERY_KEY,
						"remote",
					]) || [];
				const remoteExistingIndex = remoteChats.findIndex(
					(c) => c.id === conversationId,
				);
				const updatedRemoteChats = [...remoteChats];

				if (remoteExistingIndex >= 0) {
					updatedRemoteChats[remoteExistingIndex] = updatedConversation;
				} else {
					updatedRemoteChats.unshift(updatedConversation);
				}

				queryClient.setQueryData(
					[CHATS_QUERY_KEY, "remote"],
					updatedRemoteChats,
				);
			}

			if (isLocalOnly) {
				await localChatService.saveLocalChat({
					...updatedConversation,
					isLocalOnly: true,
				});
			}
		},
		[queryClient, determineStorageMode],
	);

	const addMessageToConversation = useCallback(
		async (conversationId: string, message: Message) => {
			await updateConversation(conversationId, (oldData) => {
				if (!oldData) {
					const messageContent =
						typeof message.content === "string"
							? message.content
							: message.content
									.map((item) => (item.type === "text" ? item.text : ""))
									.join(" ");

					return {
						id: conversationId,
						title: `${messageContent.slice(0, 20)}...`,
						messages: [message],
						isLocalOnly: false,
					};
				}

				return {
					...oldData,
					messages: [...oldData.messages, message],
				};
			});
		},
		[updateConversation],
	);

	const updateAssistantMessage = useCallback(
		async (
			conversationId: string,
			content: string,
			reasoning?: string,
			messageData?: Partial<Message>,
		) => {
			assistantResponseRef.current = content;
			if (reasoning) {
				assistantReasoningRef.current = reasoning;
			}

			await updateConversation(conversationId, (oldData) => {
				if (!oldData) {
					return {
						id: conversationId,
						title: `${content.slice(0, 20)}...`,
						messages: [
							{
								role: "assistant",
								content: content,
								id: messageData?.id || crypto.randomUUID(),
								created: messageData?.created || Date.now(),
								model: messageData?.model || model,
								reasoning: reasoning
									? {
											collapsed: true,
											content: reasoning,
										}
									: undefined,
								...messageData,
							},
						],
						isLocalOnly: false,
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
						model: model,
					});
				}

				const lastMessage =
					updatedConversation.messages[updatedConversation.messages.length - 1];

				if (messageData) {
					updatedConversation.messages[
						updatedConversation.messages.length - 1
					] = {
						...lastMessage,
						...messageData,
						role: "assistant",
						content: content,
						reasoning: reasoning
							? {
									collapsed: true,
									content: reasoning,
								}
							: lastMessage.reasoning,
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
			});
		},
		[model, updateConversation],
	);

	const generateConversationTitle = useCallback(
		async (
			conversationId: string,
			messages: Message[],
			assistantMessage: Message,
		) => {
			try {
				const userMessage = messages[0] || { content: "" };
				const titleText =
					typeof userMessage.content === "string"
						? userMessage.content
						: userMessage.content
								.map((item) => (item.type === "text" ? item.text : ""))
								.join(" ");
				const tempTitle = `${titleText.slice(0, 30)}${titleText.length > 30 ? "..." : ""}`;

				await updateConversation(conversationId, (oldData) => ({
					...oldData!,
					title: tempTitle,
				}));

				const finalTitle = await generateTitle.mutateAsync({
					completion_id: conversationId,
					messages: [...messages, assistantMessage],
				});

				await updateConversation(conversationId, (oldData) => ({
					...oldData!,
					title: finalTitle,
				}));
			} catch (error) {
				console.error("Failed to generate title:", error);
			}
		},
		[generateTitle, updateConversation],
	);

	const generateResponse = useCallback(
		async (messages: Message[], conversationId: string): Promise<string> => {
			const isLocal = chatMode === "local";
			let response = "";

			await updateAssistantMessage(conversationId, "");

			const handleMessageUpdate = (content: string, reasoning?: string) => {
				response = content;
				updateAssistantMessage(conversationId, content, reasoning);
			};

			try {
				if (isLocal) {
					const handleProgress = (text: string) => {
						response += text;
						assistantResponseRef.current = response;
						updateAssistantMessage(conversationId, response);
					};

					const lastMessage = messages[messages.length - 1];
					const lastMessageContent =
						typeof lastMessage.content === "string"
							? lastMessage.content
							: lastMessage.content.map((item) => item.text).join("");

					response = await webLLMService.current.generate(
						String(conversationId),
						lastMessageContent,
						async (_chatId, content, _model, _mode, role) => {
							if (role !== "user") handleMessageUpdate(content);
							return [];
						},
						handleProgress,
					);
				} else {
					const shouldStore =
						isAuthenticated &&
						isPro &&
						!localOnlyMode &&
						!chatSettings.localOnly;

					const assistantMessage = await apiService.streamChatCompletions(
						conversationId,
						messages,
						model,
						chatMode,
						chatSettings,
						controller.signal,
						(text) => handleMessageUpdate(text),
						shouldStore,
					);

					const messageContent =
						typeof assistantMessage.content === "string"
							? assistantMessage.content
							: assistantMessage.content.map((item) => item.text).join("");

					response = messageContent;

					await updateAssistantMessage(
						conversationId,
						messageContent,
						assistantMessage.reasoning?.content,
						{
							id: assistantMessage.id,
							created: assistantMessage.created,
							model: assistantMessage.model,
							citations: assistantMessage.citations,
							usage: assistantMessage.usage,
							log_id: assistantMessage.log_id,
						},
					);
				}

				if (messages.length <= 2) {
					setTimeout(() => {
						const assistantMessage: Message = {
							id: crypto.randomUUID(),
							created: Date.now(),
							model: model,
							role: "assistant",
							content: response,
							reasoning: assistantReasoningRef.current
								? { collapsed: true, content: assistantReasoningRef.current }
								: undefined,
						};

						generateConversationTitle(
							conversationId,
							messages,
							assistantMessage,
						).catch((err) =>
							console.error("Background title generation failed:", err),
						);
					}, 0);
				}

				return response;
			} catch (error) {
				if (controller.signal.aborted) {
					throw new Error("Request aborted");
				}
				throw error;
			}
		},
		[
			chatMode,
			updateAssistantMessage,
			isAuthenticated,
			isPro,
			localOnlyMode,
			chatSettings,
			model,
			controller,
			generateConversationTitle,
		],
	);

	const streamResponse = useCallback(
		async (messages: Message[], conversationId: string) => {
			if (!messages.length) {
				addError("No messages provided");
				throw new Error("No messages provided");
			}

			try {
				const response = await generateResponse(messages, conversationId);
				return response;
			} catch (error) {
				if (controller.signal.aborted) {
					addError("Request aborted", "info");
				} else {
					const streamError = error as Error & {
						status?: number;
						code?: string;
					};
					console.error("Error generating response:", streamError);

					if (streamError.status === 429) {
						addError("Rate limit exceeded. Please try again later.");
					} else if (streamError.code === "model_not_found") {
						addError(`Model not found: ${model}`);
						setModel("");
					} else {
						addError(streamError.message || "Failed to generate response");
					}

					throw streamError;
				}
			} finally {
				setStreamStarted(false);
				stopLoading("stream-response");
				setController(new AbortController());
			}
		},
		[addError, generateResponse, controller, stopLoading, model, setModel],
	);

	const sendMessage = useCallback(
		async (input: string, imageData?: string) => {
			if (!input.trim() && !imageData) {
				return false;
			}

			setStreamStarted(true);
			startLoading("stream-response", "Generating response...");

			let userMessage: Message;
			if (imageData) {
				userMessage = {
					role: "user",
					content: [
						{
							type: "text",
							text: input.trim(),
						},
						{
							type: "image_url",
							image_url: {
								url: imageData,
								detail: "auto",
							},
						},
					],
					id: crypto.randomUUID(),
					created: Date.now(),
					model,
				};
			} else {
				userMessage = {
					role: "user",
					content: input.trim(),
					id: crypto.randomUUID(),
					created: Date.now(),
					model,
				};
			}

			let conversationId = currentConversationId;
			if (!conversationId) {
				conversationId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
				startNewConversation(conversationId);
			}

			console.log("Using conversation ID:", conversationId);

			await queryClient.cancelQueries({ queryKey: [CHATS_QUERY_KEY] });
			await queryClient.cancelQueries({
				queryKey: [CHATS_QUERY_KEY, conversationId],
				exact: true,
			});

			const previousConversation = queryClient.getQueryData<Conversation>([
				CHATS_QUERY_KEY,
				conversationId,
			]);

			await addMessageToConversation(conversationId, userMessage);

			let updatedMessages: Message[] = [];
			if (
				!previousConversation ||
				previousConversation?.messages?.length === 0
			) {
				updatedMessages = [userMessage];
			} else {
				updatedMessages = [...previousConversation.messages, userMessage];
			}

			try {
				const response = await streamResponse(updatedMessages, conversationId);
				return response;
			} catch (error) {
				console.error("Failed to send message:", error);
				addError("Failed to send message. Please try again.");
				return null;
			}
		},
		[
			model,
			currentConversationId,
			startNewConversation,
			queryClient,
			streamResponse,
			addError,
			startLoading,
			addMessageToConversation,
		],
	);

	const abortStream = useCallback(() => {
		if (controller) {
			controller.abort();
		}
	}, [controller]);

	return {
		streamStarted,
		controller,
		assistantResponseRef,
		assistantReasoningRef,

		sendMessage,
		streamResponse,
		abortStream,
		updateAssistantMessage,
	};
}
