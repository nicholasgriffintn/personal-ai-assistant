import { useQueryClient } from "@tanstack/react-query";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import "../styles/scrollbar.css";
import "../styles/github.css";
import "../styles/github-dark.css";
import { useLoading } from "../contexts/LoadingContext";
import { useAutoscroll } from "../hooks/useAutoscroll";
import { useChat, useSendMessage } from "../hooks/useChat";
import { useStreamResponse } from "../hooks/useStreamResponse";
import { defaultModel } from "../lib/models";
import { useChatStore } from "../stores/chatStore";
import type { ChatMode, ChatSettings, Conversation, Message } from "../types";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import LoadingSpinner from "./LoadingSpinner";
import { Logo } from "./Logo";
import { MessageSkeleton } from "./MessageSkeleton";
import { SampleQuestions } from "./SampleQuestions";

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
	const queryClient = useQueryClient();
	const { currentConversationId, startNewConversation } = useChatStore();

	const { data: currentConversation, isLoading: isLoadingConversation } =
		useChat(currentConversationId);
	const sendMessage = useSendMessage();

	const [input, setInput] = useState<string>("");
	const [mode, setMode] = useState("remote" as ChatMode);
	const [model, setModel] = useState(defaultModel);
	const [chatSettings, setChatSettings] =
		useState<ChatSettings>(defaultSettings);
	const { isLoading, getMessage, getProgress } = useLoading();
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const abortControllerRef = useRef<AbortController | null>(null);

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
		onModelInitError: () => {
			console.error("Failed to initialize model, clearing selected model.");
			setModel("");
		},
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
		// TODO: Uncomment this when it's better, needs to only scroll to the bottom if the user has not scrolled themselves.
		// scrollToBottom();
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

				queryClient.setQueryData(
					["chats", currentConversationId],
					(oldData: Conversation | undefined) => {
						if (!oldData) return oldData;

						const updatedConversation = JSON.parse(JSON.stringify(oldData));
						updatedConversation.messages[index] = {
							...updatedConversation.messages[index],
							reasoning: {
								...updatedConversation.messages[index].reasoning!,
								collapsed: !showReasoning,
							},
						};

						return updatedConversation;
					},
				);
			} else {
				console.info("No reasoning found for message at index", index);
			}
		},
		[currentConversation, currentConversationId],
	);

	const handleSubmit = async (e: FormEvent, imageData?: string) => {
		e.preventDefault();
		if (!input.trim() && !imageData) {
			return;
		}

		try {
			localStorage.setItem(
				"userSettings",
				JSON.stringify({
					model,
					mode,
					chatSettings,
				}),
			);
		} catch (error) {
			console.error("Failed to save settings:", error);
			alert("Failed to save settings. Please try again.");
		}

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

		if (!currentConversationId) {
			startNewConversation();
		}

		const conversationId =
			currentConversationId ||
			`${Date.now()}-${Math.floor(Math.random() * 1000)}`;
		let updatedMessages: Message[] = [];

		if (!currentConversation || currentConversation?.messages?.length === 0) {
			updatedMessages = [userMessage];
		} else {
			updatedMessages = [...currentConversation.messages, userMessage];
		}

		sendMessage.mutate({
			conversationId: conversationId,
			message: userMessage,
		});

		setInput("");

		try {
			await streamResponse([...updatedMessages]);
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

	const handleChatSettingsChange = (newSettings: ChatSettings) => {
		setChatSettings(newSettings);

		try {
			localStorage.setItem(
				"userSettings",
				JSON.stringify({
					model,
					mode,
					chatSettings: newSettings,
				}),
			);
		} catch (error) {
			console.error("Failed to save settings:", error);
		}
	};

	if (isLoadingConversation && isInitialLoad) {
		return (
			<div className="flex h-full items-center justify-center">
				<LoadingSpinner />
			</div>
		);
	}

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
							<h2 className="md:text-4xl text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
								What do you want to know?
							</h2>
							<p className="text-zinc-600 dark:text-zinc-400 mb-4 mt-2">
								I'm a helpful assistant that can answer questions about
								basically anything.
							</p>
							<SampleQuestions setInput={setInput} />
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
						onChatSettingsChange={handleChatSettingsChange}
						onTranscribe={handleTranscribe}
					/>
				</div>
			</div>
		</div>
	);
};
