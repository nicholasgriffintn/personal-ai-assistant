import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { CHATS_QUERY_KEY } from "../constants";
import { useError } from "../contexts/ErrorContext";
import { useLoading } from "../contexts/LoadingContext";
import { apiService } from "../lib/api-service";
import { localChatService } from "../lib/local-chat-service";
import { webLLMModels } from "../lib/models";
import { WebLLMService } from "../lib/web-llm";
import { useChatStore } from "../stores/chatStore";
import type { Conversation, Message } from "../types";
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

	const updateConversation = useCallback(
		async (
			content: string,
			reasoning?: string,
			message?: Message,
			explicitConversationId?: string,
		) => {
			const conversationId = explicitConversationId || currentConversationId;
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
							messages: [
								{
									role: "assistant",
									content: content,
									id: crypto.randomUUID(),
									created: Date.now(),
									model: message?.model || model,
									reasoning: reasoning
										? {
												collapsed: true,
												content: reasoning,
											}
										: undefined,
								},
							],
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
							model: message?.model || model,
						});
					}

					const lastMessage =
						updatedConversation.messages[
							updatedConversation.messages.length - 1
						];

					if (message) {
						updatedConversation.messages[
							updatedConversation.messages.length - 1
						] = {
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
				},
			);

			queryClient.setQueryData(
				[CHATS_QUERY_KEY],
				(oldData: Conversation[] | undefined) => {
					if (!oldData) {
						const conversation = queryClient.getQueryData([
							CHATS_QUERY_KEY,
							conversationId,
						]) as Conversation;
						return conversation ? [conversation] : [];
					}

					const updatedConversation = queryClient.getQueryData([
						CHATS_QUERY_KEY,
						conversationId,
					]) as Conversation;

					if (!updatedConversation) return oldData;

					const existingIndex = oldData.findIndex(
						(conv) => conv.id === conversationId,
					);

					if (existingIndex >= 0) {
						const newData = [...oldData];
						newData[existingIndex] = updatedConversation;
						return newData;
					}

					return [updatedConversation, ...oldData];
				},
			);

			const conversationData = queryClient.getQueryData<Conversation>([
				CHATS_QUERY_KEY,
				conversationId,
			]);
			const isConversationLocalOnly = conversationData?.isLocalOnly || false;

			const shouldSaveLocally =
				!isAuthenticated ||
				!isPro ||
				localOnlyMode ||
				chatSettings.localOnly === true ||
				chatMode === "local" ||
				isConversationLocalOnly;

			if (shouldSaveLocally) {
				const updatedConversation = queryClient.getQueryData<Conversation>([
					CHATS_QUERY_KEY,
					conversationId,
				]);

				if (updatedConversation) {
					const localConversation: Conversation = {
						...updatedConversation,
						isLocalOnly: true,
					};
					await localChatService.saveLocalChat(localConversation);
				}

				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY, "local"],
					exact: true,
				});
			}

			await new Promise((resolve) => setTimeout(resolve, 50));
		},
		[
			currentConversationId,
			model,
			queryClient,
			isAuthenticated,
			isPro,
			localOnlyMode,
			chatSettings,
			chatMode,
		],
	);

	const finalizeAssistantResponse = useCallback(
		async (explicitConversationId?: string) => {
			const conversationId = explicitConversationId || currentConversationId;
			if (!conversationId) return;

			try {
				const conversation = queryClient.getQueryData<Conversation>([
					CHATS_QUERY_KEY,
					conversationId,
				]);

				if (conversation) {
					const messagesBeforeFinalize = conversation.messages;

					setTimeout(() => {
						const currentConversation = queryClient.getQueryData<Conversation>([
							CHATS_QUERY_KEY,
							conversationId,
						]);

						if (currentConversation) {
							if (
								!currentConversation.messages ||
								currentConversation.messages.length <
									messagesBeforeFinalize.length
							) {
								queryClient.setQueryData<Conversation>(
									[CHATS_QUERY_KEY, conversationId],
									{
										...currentConversation,
										messages: messagesBeforeFinalize,
									},
								);
							}

							if (currentConversation.isLocalOnly) {
								queryClient.invalidateQueries({
									queryKey: [CHATS_QUERY_KEY, "local"],
									exact: true,
								});
							} else {
								queryClient.invalidateQueries({
									queryKey: [CHATS_QUERY_KEY, conversationId],
								});
							}
						}
					}, 1000);
				}
			} catch (error) {
				console.error("Failed to finalize assistant response:", error);
			}
		},
		[currentConversationId, queryClient],
	);

	const generateResponse = useCallback(
		async (
			messages: Message[],
			generateFn: (
				messages: Message[],
				handleProgress: (text: string) => void,
			) => Promise<string>,
		): Promise<string> => {
			let response = "";

			const handleProgress = (text: string) => {
				response += text;
				assistantResponseRef.current = response;
				updateConversation(response);
			};

			try {
				const result = await generateFn(messages, handleProgress);
				finalizeAssistantResponse();
				return result;
			} catch (error) {
				console.error("Error generating response:", error);
				const streamError = error as Error & { status?: number; code?: string };

				if (streamError.status === 429) {
					addError("Rate limit exceeded. Please try again later.");
				} else if (streamError.code === "model_not_found") {
					addError(`Model not found: ${model}`);
					setModel("");
				} else {
					addError(streamError.message || "Failed to generate response");
				}

				throw error;
			} finally {
				setStreamStarted(false);
				stopLoading("stream-response");
			}
		},
		[
			updateConversation,
			finalizeAssistantResponse,
			stopLoading,
			addError,
			model,
			setModel,
		],
	);

	const handleLocalGeneration = useCallback(
		async (
			messages: Message[],
			explicitConversationId?: string,
		): Promise<string> => {
			const conversationId = explicitConversationId || currentConversationId;
			if (!conversationId) {
				throw new Error("No conversation ID available");
			}

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
							await updateConversation(
								content,
								undefined,
								undefined,
								conversationId,
							);

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
						return [];
					},
					handleProgress,
				);
			}).then(async (result) => {
				if (messages.length <= 2) {
					try {
						const existingConversation = queryClient.getQueryData<Conversation>(
							[CHATS_QUERY_KEY, conversationId],
						);

						if (existingConversation) {
							const assistantMessage: Message = {
								id: crypto.randomUUID(),
								created: Date.now(),
								model: model,
								role: "assistant",
								content: assistantResponseRef.current,
							};

							await generateTitle.mutateAsync({
								completion_id: conversationId,
								messages: [...messages, assistantMessage],
							});

							const updatedConversation =
								queryClient.getQueryData<Conversation>([
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
		},
		[
			currentConversationId,
			generateResponse,
			model,
			queryClient,
			updateConversation,
			generateTitle,
		],
	);

	const handleRemoteGeneration = useCallback(
		async (
			messages: Message[],
			explicitConversationId?: string,
		): Promise<string> => {
			const conversationId = explicitConversationId || currentConversationId;
			if (!conversationId) {
				throw new Error("No conversation ID available");
			}

			return generateResponse(messages, async (messages) => {
				try {
					const shouldStore =
						isAuthenticated &&
						isPro &&
						!localOnlyMode &&
						!chatSettings.localOnly;

					const messagesCopy = [...messages];

					const existingConversationBeforeApi =
						queryClient.getQueryData<Conversation>([
							CHATS_QUERY_KEY,
							conversationId,
						]);

					const assistantMessage = await apiService.streamChatCompletions(
						conversationId,
						messages,
						model,
						chatMode,
						chatSettings,
						controller.signal,
						(text) => {
							assistantResponseRef.current = text;
							updateConversation(text, undefined, undefined, conversationId);

							queryClient.invalidateQueries({
								queryKey: [CHATS_QUERY_KEY, conversationId],
							});
						},
						shouldStore,
					);

					if (assistantMessage.reasoning) {
						assistantReasoningRef.current = assistantMessage.reasoning.content;
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
						conversationId,
					);

					queryClient.invalidateQueries({
						queryKey: [CHATS_QUERY_KEY, conversationId],
					});

					if (messages.length <= 2) {
						try {
							const existingConversation =
								queryClient.getQueryData<Conversation>([
									CHATS_QUERY_KEY,
									conversationId,
								]);

							if (existingConversation) {
								const messagesBeforeTitleGeneration =
									existingConversation.messages;

								await generateTitle.mutateAsync({
									completion_id: conversationId,
									messages: [...messagesCopy, assistantMessage],
								});

								const conversationAfterTitleGeneration =
									queryClient.getQueryData<Conversation>([
										CHATS_QUERY_KEY,
										conversationId,
									]);

								if (
									conversationAfterTitleGeneration &&
									(!conversationAfterTitleGeneration.messages ||
										conversationAfterTitleGeneration.messages.length <
											messagesBeforeTitleGeneration.length)
								) {
									queryClient.setQueryData<Conversation>(
										[CHATS_QUERY_KEY, conversationId],
										{
											...conversationAfterTitleGeneration,
											messages: messagesBeforeTitleGeneration,
										},
									);

									queryClient.invalidateQueries({
										queryKey: [CHATS_QUERY_KEY, conversationId],
									});
								}
							} else {
								console.warn(
									"Cannot generate title: conversation not found in cache",
								);
							}
						} catch (error) {
							console.error("Failed to generate title:", error);

							if (existingConversationBeforeApi) {
								queryClient.setQueryData<Conversation>(
									[CHATS_QUERY_KEY, conversationId],
									existingConversationBeforeApi,
								);

								queryClient.invalidateQueries({
									queryKey: [CHATS_QUERY_KEY, conversationId],
								});
							}
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
		},
		[
			currentConversationId,
			generateResponse,
			isAuthenticated,
			isPro,
			localOnlyMode,
			chatSettings,
			model,
			chatMode,
			controller,
			updateConversation,
			generateTitle,
			queryClient,
		],
	);

	const streamResponse = useCallback(
		async (messages: Message[], explicitConversationId?: string) => {
			if (!messages.length) {
				addError("No messages provided");
				throw new Error("No messages provided");
			}

			const conversationId = explicitConversationId || currentConversationId;

			if (!conversationId) {
				addError("No conversation ID available");
				throw new Error("No conversation ID available");
			}

			const existingConversation = queryClient.getQueryData<Conversation>([
				CHATS_QUERY_KEY,
				conversationId,
			]);

			if (!existingConversation && messages.length > 0) {
				const userMessage = messages[messages.length - 1];
				const messageContent =
					typeof userMessage.content === "string"
						? userMessage.content
						: userMessage.content
								.map((item) => (item.type === "text" ? item.text : ""))
								.join(" ");

				queryClient.setQueryData<Conversation>(
					[CHATS_QUERY_KEY, conversationId],
					{
						id: conversationId,
						title: `${messageContent.slice(0, 20)}...`,
						messages: [...messages],
					},
				);

				queryClient.setQueryData<Conversation[]>([CHATS_QUERY_KEY], (old) => {
					if (!old)
						return [
							{
								id: conversationId,
								title: `${messageContent.slice(0, 20)}...`,
								messages: [...messages],
							},
						];

					return [
						{
							id: conversationId,
							title: `${messageContent.slice(0, 20)}...`,
							messages: [...messages],
						},
						...old.filter((c) => c.id !== conversationId),
					];
				});

				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY],
				});

				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY, conversationId],
				});
			}

			try {
				const response =
					chatMode === "local"
						? await handleLocalGeneration(messages, conversationId)
						: await handleRemoteGeneration(messages, conversationId);

				await finalizeAssistantResponse(conversationId);

				if (chatMode === "local") {
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

				const finalConversation = queryClient.getQueryData<Conversation>([
					CHATS_QUERY_KEY,
					conversationId,
				]);

				if (finalConversation?.isLocalOnly) {
					queryClient.invalidateQueries({
						queryKey: [CHATS_QUERY_KEY, "local"],
						exact: true,
					});
				} else {
					queryClient.invalidateQueries({
						queryKey: [CHATS_QUERY_KEY, conversationId],
					});
				}

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
					addError(streamError.message || "Failed to generate response");

					const errorConversation = queryClient.getQueryData<Conversation>([
						CHATS_QUERY_KEY,
						conversationId,
					]);

					if (errorConversation?.isLocalOnly) {
						queryClient.invalidateQueries({
							queryKey: [CHATS_QUERY_KEY, "local"],
							exact: true,
						});
					} else {
						queryClient.invalidateQueries({
							queryKey: [CHATS_QUERY_KEY, conversationId],
						});
					}

					throw streamError;
				}
			} finally {
				setStreamStarted(false);
				stopLoading("stream-response");
				setController(new AbortController());
			}
		},
		[
			addError,
			chatMode,
			handleLocalGeneration,
			handleRemoteGeneration,
			finalizeAssistantResponse,
			currentConversationId,
			queryClient,
			controller,
			stopLoading,
		],
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
			});

			const previousConversation = queryClient.getQueryData<Conversation>([
				CHATS_QUERY_KEY,
				conversationId,
			]);

			let updatedMessages: Message[] = [];
			if (
				!previousConversation ||
				previousConversation?.messages?.length === 0
			) {
				updatedMessages = [userMessage];
			} else {
				updatedMessages = [...previousConversation.messages, userMessage];
			}

			if (previousConversation) {
				queryClient.setQueryData<Conversation>(
					[CHATS_QUERY_KEY, conversationId],
					(old) => {
						if (!old)
							return {
								id: conversationId,
								title: `${input.trim().slice(0, 20)}...`,
								messages: [userMessage],
							};

						return {
							...old,
							messages: [...old.messages, userMessage],
						};
					},
				);
			} else {
				queryClient.setQueryData<Conversation>(
					[CHATS_QUERY_KEY, conversationId],
					{
						id: conversationId,
						title: `${input.trim().slice(0, 20)}...`,
						messages: [userMessage],
					},
				);
			}

			queryClient.setQueryData<Conversation[]>([CHATS_QUERY_KEY], (old) => {
				if (!old)
					return [
						{
							id: conversationId,
							title: `${input.trim().slice(0, 20)}...`,
							messages: [userMessage],
						},
					];

				const existingConversation = old.find((c) => c.id === conversationId);

				if (existingConversation) {
					return old.map((c) => {
						if (c.id === conversationId) {
							return {
								...c,
								messages: [...c.messages, userMessage],
							};
						}
						return c;
					});
				}

				return [
					{
						id: conversationId,
						title: `${input.trim().slice(0, 20)}...`,
						messages: [userMessage],
					},
					...old,
				];
			});

			const existingConversation = queryClient.getQueryData<Conversation>([
				CHATS_QUERY_KEY,
				conversationId,
			]);
			const isConversationLocalOnly =
				existingConversation?.isLocalOnly || false;

			const shouldSaveLocally =
				!isAuthenticated ||
				!isPro ||
				localOnlyMode ||
				chatSettings.localOnly === true ||
				chatMode === "local" ||
				isConversationLocalOnly;

			if (shouldSaveLocally) {
				const updatedConversation = queryClient.getQueryData<Conversation>([
					CHATS_QUERY_KEY,
					conversationId,
				]);

				if (updatedConversation) {
					const localConversation: Conversation = {
						...updatedConversation,
						isLocalOnly: true,
					};
					await localChatService.saveLocalChat(localConversation);
				}

				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY, "local"],
					exact: true,
				});
			}

			await new Promise((resolve) => setTimeout(resolve, 50));

			try {
				const response = await streamResponse(
					[...updatedMessages],
					conversationId,
				);

				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY],
				});

				queryClient.invalidateQueries({
					queryKey: [CHATS_QUERY_KEY, conversationId],
				});

				return response;
			} catch (error) {
				console.error("Failed to send message:", error);
				addError("Failed to send message. Please try again.");
				return null;
			}
		},
		[
			model,
			chatMode,
			currentConversationId,
			startNewConversation,
			queryClient,
			isAuthenticated,
			isPro,
			localOnlyMode,
			chatSettings,
			streamResponse,
			addError,
			startLoading,
		],
	);

	const abortStream = useCallback(() => {
		if (controller) {
			controller.abort();
		}
	}, [controller]);

	return {
		// State
		streamStarted,
		controller,
		assistantResponseRef,
		assistantReasoningRef,

		// Actions
		sendMessage,
		streamResponse,
		abortStream,
		updateConversation,
		finalizeAssistantResponse,
	};
}
