import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	type FormEvent,
	useRef,
} from "react";

import "../styles/scrollbar.css";
import "../styles/github.css";
import "../styles/github-dark.css";
import type { ChatMode, Conversation, Message, ChatSettings } from "../types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useAutoscroll } from "../hooks/useAutoscroll";
import { useStreamResponse } from "../hooks/useStreamResponse";
import { defaultModel } from "../lib/models";
import { useLoading } from "../contexts/LoadingContext";
import LoadingSpinner from "./LoadingSpinner";
import { MessageSkeleton } from "./MessageSkeleton";
import { Logo } from "./Logo";
import { useChatStore } from "../stores/chatStore";

const defaultSettings: ChatSettings = {
	temperature: 1,
	top_p: 1,
	max_tokens: 2048,
	presence_penalty: 0,
	frequency_penalty: 0,
	useRAG: false,
	ragOptions: {
		topK: 3,
		scoreThreshold: 0.5,
		includeMetadata: false,
		namespace: "",
	},
	responseMode: "normal",
};

export const ConversationThread = () => {
	const {
		conversations,
		setConversations,
		currentConversationId,
		fetchConversation,
	} = useChatStore();

	const [input, setInput] = useState<string>("");
	const [mode, setMode] = useState("remote" as ChatMode);
	const [model, setModel] = useState(defaultModel);
	const [chatSettings, setChatSettings] =
		useState<ChatSettings>(defaultSettings);
	const { isLoading, getMessage, getProgress } = useLoading();
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const abortControllerRef = useRef<AbortController | null>(null);

	const currentConversation = useMemo(
		() =>
			(Array.isArray(conversations) &&
				conversations.find((conv) => conv.id === currentConversationId)) ||
			null,
		[conversations, currentConversationId],
	);

	const messages = useMemo(
		() => currentConversation?.messages || [],
		[currentConversation?.messages],
	);

	const { messagesEndRef, messagesContainerRef, scrollToBottom } =
		useAutoscroll();

	const {
		streamStarted,
		controller,
		streamResponse,
		aiResponseRef,
		aiReasoningRef,
	} = useStreamResponse({
		conversationId: currentConversationId,
		scrollToBottom,
		mode,
		model,
		chatSettings,
	});

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// Cmd/Ctrl + Enter to submit
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				if (
					input.trim() &&
					!isLoading("stream-response") &&
					!isLoading("model-init")
				) {
					handleSubmit(e as unknown as FormEvent);
				}
			}

			// Esc to stop stream
			if (e.key === "Escape" && controller) {
				controller.abort();
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => {
			window.removeEventListener("keydown", handleKeyPress);
		};
	}, [input, isLoading, controller]);

	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [aiReasoningRef.current, aiResponseRef.current, messages.length]);

	useEffect(() => {
		let isMounted = true;

		const loadSettings = async () => {
			try {
				const savedSettings = localStorage.getItem("userSettings");
				if (isMounted && savedSettings) {
					const parsedSettings = JSON.parse(savedSettings);
					setMode(parsedSettings.mode || "remote");
					setModel(parsedSettings.model || defaultModel);
					setChatSettings(parsedSettings.chatSettings || defaultSettings);
				}
			} catch (error) {
				console.error("Failed to load settings:", error);
				if (isMounted) {
					alert("Failed to load settings. Please try again.");
				}
			} finally {
				if (isMounted) {
					setIsInitialLoad(false);
				}
			}
		};
		
		loadSettings();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (currentConversationId) {
			fetchConversation(currentConversationId)
				.catch(error => console.error("Failed to fetch conversation:", error));
		}
	}, [currentConversationId, fetchConversation]);

	const setShowMessageReasoning = useCallback(
		(index: number, showReasoning: boolean) => {
			if (!currentConversation) {
				console.error("No current conversation");
				return;
			}

			const updatedMessages = [...currentConversation.messages];
			if (updatedMessages[index]?.reasoning) {
				updatedMessages[index] = {
					...updatedMessages[index],
					reasoning: {
						...updatedMessages[index].reasoning!,
						collapsed: !showReasoning,
					},
				};

				setConversations((prev) => {
					return prev.map((conv) => {
						if (conv.id === currentConversationId) {
							return { ...conv, messages: updatedMessages };
						}
						return conv;
					});
				});
			}
		},
		[currentConversation, currentConversationId, setConversations],
	);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim()) {
			console.error("No input");
			return;
		}

		if (!currentConversationId) {
			console.error("No current conversation id");
			return;
		}

		try {
			localStorage.setItem("userSettings", JSON.stringify({
				model,
				mode,
				chatSettings,
			}));
		} catch (error) {
			console.error("Failed to save settings:", error);
			alert("Failed to save settings. Please try again.");
		}

		const userMessage: Message = {
			role: "user",
			content: input,
			id: crypto.randomUUID(),
			created: Date.now(),
			model,
		};
		let updatedMessages: Message[] = [];

		if (!currentConversation || currentConversation?.messages?.length === 0) {
			const newConversation: Conversation = {
				id: currentConversationId,
				title: "New conversation",
				messages: [userMessage],
			};

			setConversations((prev) => {
				const filtered = prev.filter((c) => c.id !== currentConversationId);
				const result = [newConversation, ...filtered];

				return result;
			});

			updatedMessages = [userMessage];
		} else if (currentConversation) {
			setConversations((prev) => {
				const result = prev.map((c) => {
					if (c.id === currentConversationId) {
						const updated = {
							...c,
							messages: [...c.messages, userMessage],
						};

						return updated;
					}
					return c;
				});

				return result;
			});

			updatedMessages = [...currentConversation?.messages || [], userMessage];
		}

		if (updatedMessages.length === 0) {
			console.log("No updated messages");
			return;
		}

		setInput("");

		try {
			await streamResponse(updatedMessages);
		} catch (error) {
			console.error("Failed to send message:", error);
			alert("Failed to send message. Please try again.");
		}
	};

	const handleTranscribe = async (data: {
		response: {
			content: string;
		};
	}) => {
		setInput(data.response.content);
	};

	return (
		<div className="flex flex-col h-[calc(100%-3rem)] w-full">
			<div
				ref={messagesContainerRef}
				className={`flex-1 overflow-x-hidden ${messages.length === 0 ? "flex items-center" : "overflow-y-scroll"}`}
			>
				<div className="w-full px-4 max-w-2xl mx-auto">
					{messages.length === 0 ? (
						<div className="text-center w-full">
							<div className="w-32 h-32 mx-auto">
								<Logo />
							</div>
							<h2 className="text-4xl font-semibold text-zinc-800 dark:text-zinc-200">
								What do you want to know?
							</h2>
						</div>
					) : isInitialLoad ? (
						<div className="py-4 space-y-4">
							{[...Array(3)].map((_, i) => (
								<MessageSkeleton key={`skeleton-${i}`} />
							))}
						</div>
					) : (
						<div className="py-4 space-y-4">
							{messages.map((message, index) => (
								<ChatMessage
									key={`${message.id}-${index}`}
									message={message}
									index={index}
									setShowMessageReasoning={setShowMessageReasoning}
								/>
							))}
							{isLoading("stream-response") && (
								<div className="flex justify-center py-4">
									<LoadingSpinner message={getMessage("stream-response")} />
								</div>
							)}
							{isLoading("model-init") && (
								<div className="flex justify-center py-4">
									<LoadingSpinner
										message={getMessage("model-init")}
										progress={getProgress("model-init")}
									/>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>
			</div>

			<div className="p-4">
				<div className="max-w-2xl mx-auto">
					<ChatInput
						input={input}
						setInput={setInput}
						handleSubmit={handleSubmit}
						isLoading={isLoading("stream-response") || isLoading("model-init")}
						streamStarted={streamStarted}
						controller={controller}
						mode={mode}
						onModeChange={setMode}
						model={model}
						onModelChange={setModel}
						chatSettings={chatSettings}
						onChatSettingsChange={setChatSettings}
						onTranscribe={handleTranscribe}
					/>
				</div>
			</div>
		</div>
	);
};
