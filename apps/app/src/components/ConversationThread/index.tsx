import { ChevronDown, MessagesSquare } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import "~/styles/scrollbar.css";
import "~/styles/github.css";
import "~/styles/github-dark.css";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { Logo } from "~/components/Logo";
import { useAutoscroll } from "~/hooks/useAutoscroll";
import { useChat } from "~/hooks/useChat";
import { useChatManager } from "~/hooks/useChatManager";
import {
	useIsLoading,
	useLoadingMessage,
	useLoadingProgress,
} from "~/state/contexts/LoadingContext";
import { useChatStore } from "~/state/stores/chatStore";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { ChatMessage } from "./ChatMessage/index";
import { MessageSkeleton } from "./MessageSkeleton";
import { SampleQuestions } from "./SampleQuestions";

export const ConversationThread = () => {
	const { currentConversationId } = useChatStore();

	const { data: currentConversation, isLoading: isLoadingConversation } =
		useChat(currentConversationId);

	const { streamStarted, controller, sendMessage, abortStream } =
		useChatManager();

	const [input, setInput] = useState<string>("");

	const isStreamLoading = useIsLoading("stream-response");
	const isModelInitializing = useIsLoading("model-init");

	const streamLoadingMessage = useLoadingMessage("stream-response");
	const modelInitMessage = useLoadingMessage("model-init");
	const modelInitProgress = useLoadingProgress("model-init");

	const messages = useMemo(
		() => currentConversation?.messages || [],
		[currentConversation?.messages],
	);

	const {
		messagesEndRef,
		messagesContainerRef,
		forceScrollToBottom,
		showScrollButton,
	} = useAutoscroll();

	const chatInputRef = useRef<ChatInputHandle>(null);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				if (input.trim() && !isStreamLoading && !isModelInitializing) {
					handleSubmit(e as unknown as FormEvent);
				}
			}
			if (e.key === "Escape" && controller) {
				abortStream();
				setTimeout(() => {
					chatInputRef.current?.focus();
				}, 0);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => {
			window.removeEventListener("keydown", handleKeyPress);
		};
	}, [input, isStreamLoading, isModelInitializing, controller, abortStream]);

	const handleSubmit = async (e: FormEvent, imageData?: string) => {
		e.preventDefault();
		if (!input.trim() && !imageData) {
			return;
		}

		try {
			const originalInput = input;
			setInput("");

			const result = await sendMessage(input, imageData);
			if (!result) {
				setInput(originalInput);
			} else {
				setTimeout(() => {
					chatInputRef.current?.focus();
				}, 0);
			}
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleTranscribe = async (data: {
		response: {
			content: string;
		};
	}) => {
		setInput(data.response.content);
	};

	const handleToolInteraction = (
		toolName: string,
		action: "useAsPrompt",
		data: Record<string, any>,
	) => {
		switch (toolName) {
			case "web_search":
				if (action === "useAsPrompt") {
					setInput(data.question);
				}
				break;
			default:
				break;
		}
	};

	const showWelcomeScreen =
		messages.length === 0 &&
		!currentConversationId &&
		!isStreamLoading &&
		!streamStarted;

	return (
		<div className="flex flex-col h-[calc(100%-3rem)] w-full">
			<div
				ref={messagesContainerRef}
				className={`relative flex-1 overflow-x-hidden ${showWelcomeScreen ? "flex items-center" : "overflow-y-scroll"}`}
			>
				<div className="w-full px-4 max-w-2xl mx-auto">
					{showWelcomeScreen ? (
						<div className="text-center w-full">
							<div className="w-32 h-32 mx-auto">
								<Logo variant="default" />
							</div>
							<h2 className="md:text-4xl text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
								What would you like to know?
							</h2>
							<p className="text-zinc-600 dark:text-zinc-400 mb-4 mt-2">
								I'm a helpful assistant that can answer questions about
								basically anything.
							</p>
							<SampleQuestions setInput={setInput} />
						</div>
					) : (
						<div
							className="py-4 space-y-4"
							data-conversation-id={currentConversationId}
							role="log"
							aria-live="polite"
							aria-label="Conversation messages"
							aria-atomic="false"
						>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
									<MessagesSquare size={16} />
									<span>
										{currentConversation?.title || "New conversation"}
									</span>
								</h2>
							</div>
							{isLoadingConversation ? (
								<div className="py-4 space-y-4">
									{[...Array(3)].map((_, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: It's a skeleton...
										<MessageSkeleton key={`skeleton-${i}`} />
									))}
								</div>
							) : (
								<>
									{messages.map((message, index) => (
										<ChatMessage
											key={`${message.id}-${index}`}
											message={message}
											onToolInteraction={handleToolInteraction}
										/>
									))}
									{(isStreamLoading || streamStarted) && (
										<div className="flex justify-center py-4">
											<LoadingSpinner
												message={
													streamLoadingMessage || "Generating response..."
												}
											/>
										</div>
									)}
									{isModelInitializing && (
										<div className="flex justify-center py-4">
											<LoadingSpinner
												message={modelInitMessage || "Initializing model..."}
												progress={modelInitProgress}
											/>
										</div>
									)}
								</>
							)}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>

				{showScrollButton && currentConversationId && (
					<div className="sticky bottom-6 flex justify-center px-4">
						<button
							type="button"
							onClick={forceScrollToBottom}
							className="cursor-pointer flex items-center gap-2 bg-zinc-800/90 dark:bg-zinc-700/90 text-white px-4 py-2 rounded-full shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm text-sm font-medium"
							aria-label="Scroll to bottom"
						>
							<span>Scroll to bottom</span>
							<ChevronDown size={16} />
						</button>
					</div>
				)}
			</div>

			<div className="px-4">
				<div className="max-w-2xl mx-auto">
					<ChatInput
						ref={chatInputRef}
						input={input}
						setInput={setInput}
						handleSubmit={handleSubmit}
						isLoading={isStreamLoading || isModelInitializing}
						streamStarted={streamStarted}
						controller={controller}
						onTranscribe={handleTranscribe}
					/>
				</div>
			</div>
		</div>
	);
};
