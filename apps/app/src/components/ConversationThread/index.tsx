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
import { useLoading } from "~/state/contexts/LoadingContext";
import { useChatStore } from "~/state/stores/chatStore";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { ChatMessage } from "./ChatMessage/index";
import { MessageSkeleton } from "./MessageSkeleton";
import { SampleQuestions } from "./SampleQuestions";

export const ConversationThread = () => {
	const {
		currentConversationId,
		chatMode,
		model,
		chatSettings,
		setChatMode,
		setModel,
		setChatSettings,
	} = useChatStore();

	const { data: currentConversation, isLoading: isLoadingConversation } =
		useChat(currentConversationId);

	const { streamStarted, controller, sendMessage, abortStream } =
		useChatManager();

	const [input, setInput] = useState<string>("");
	const { isLoading, getMessage, getProgress } = useLoading();

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
				if (
					input.trim() &&
					!isLoading("stream-response") &&
					!isLoading("model-init")
				) {
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
	}, [input, isLoading, controller, abortStream]);

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

	const handleChatSettingsChange = (newSettings: typeof chatSettings) => {
		setChatSettings(newSettings);
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
		!isLoading("stream-response") &&
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
									{(isLoading("stream-response") || streamStarted) && (
										<div className="flex justify-center py-4">
											<LoadingSpinner
												message={
													getMessage("stream-response") ||
													"Generating response..."
												}
											/>
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
								</>
							)}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>

				{showScrollButton && (
					<button
						type="button"
						onClick={forceScrollToBottom}
						className="fixed lg:bottom-24 bottom-48 right-8 bg-zinc-800 dark:bg-zinc-700 text-white p-2 rounded-full shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all z-10"
						aria-label="Scroll to bottom"
					>
						<ChevronDown size={20} />
						<span className="sr-only">Scroll to bottom</span>
					</button>
				)}
			</div>

			<div className="px-4">
				<div className="max-w-2xl mx-auto">
					<ChatInput
						ref={chatInputRef}
						input={input}
						setInput={setInput}
						handleSubmit={handleSubmit}
						isLoading={isLoading("stream-response") || isLoading("model-init")}
						streamStarted={streamStarted}
						controller={controller}
						mode={chatMode}
						onModeChange={setChatMode}
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
