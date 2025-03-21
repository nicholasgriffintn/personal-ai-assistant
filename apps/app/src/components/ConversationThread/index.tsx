import { ChevronDown, Loader2, MessagesSquare } from "lucide-react";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Link } from "react-router";

import "~/styles/scrollbar.css";
import "~/styles/github.css";
import "~/styles/github-dark.css";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { Logo } from "~/components/Logo";
import { useAuthStatus } from "~/hooks/useAuth";
import { useAutoscroll } from "~/hooks/useAutoscroll";
import { useChat } from "~/hooks/useChat";
import { useChatManager } from "~/hooks/useChatManager";
import {
	useIsLoading,
	useLoadingMessage,
	useLoadingProgress,
} from "~/state/contexts/LoadingContext";
import { useChatStore } from "~/state/stores/chatStore";
import { ArtifactPanel } from "./ArtifactPanel";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import type { ArtifactProps } from "./ChatMessage/ArtifactComponent";
import { ChatMessage } from "./ChatMessage/index";
import { MessageSkeleton } from "./MessageSkeleton";
import { SampleQuestions } from "./SampleQuestions";

export const ConversationThread = () => {
	const { currentConversationId, isMobile, setSidebarVisible } = useChatStore();

	const { isAuthenticated, isLoading: isAuthLoading } = useAuthStatus();

	const { data: currentConversation, isLoading: isLoadingConversation } =
		useChat(currentConversationId);

	const { streamStarted, controller, sendMessage, abortStream } =
		useChatManager();

	const [input, setInput] = useState<string>("");
	const [currentArtifact, setCurrentArtifact] = useState<ArtifactProps | null>(
		null,
	);
	const [isPanelVisible, setIsPanelVisible] = useState(false);

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

	const handleArtifactOpen = (artifact: ArtifactProps) => {
		setCurrentArtifact(artifact);
		setIsPanelVisible(true);
		if (!isMobile) {
			setSidebarVisible(false);
		}
	};

	const handlePanelClose = useCallback(() => {
		setIsPanelVisible(false);
		if (!isMobile) {
			setSidebarVisible(true);
		}
		setTimeout(() => {
			setCurrentArtifact(null);
		}, 300);
	}, [isMobile, setSidebarVisible]);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				if (input.trim() && !isStreamLoading && !isModelInitializing) {
					handleSubmit(e as unknown as FormEvent);
				}
			}
			if (e.key === "Escape") {
				if (isPanelVisible) {
					handlePanelClose();
				} else if (controller) {
					abortStream();
					setTimeout(() => {
						chatInputRef.current?.focus();
					}, 0);
				}
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => {
			window.removeEventListener("keydown", handleKeyPress);
		};
	}, [
		input,
		isStreamLoading,
		isModelInitializing,
		controller,
		abortStream,
		isPanelVisible,
		handlePanelClose,
	]);

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
		<div
			className={`flex flex-col h-[calc(100%-3rem)] w-full ${isPanelVisible ? "pr-[90%] sm:pr-[350px] md:pr-[400px] lg:pr-[650px]" : ""}`}
		>
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
										<MessageSkeleton key={`skeleton-item-${i}-${Date.now()}`} />
									))}
								</div>
							) : (
								<>
									{messages.map((message, index) => (
										<ChatMessage
											key={`${message.id}-${index}`}
											message={message}
											onToolInteraction={handleToolInteraction}
											onArtifactOpen={handleArtifactOpen}
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

			<div
				className={`absolute bottom-4 left-0 right-0 text-center text-sm text-zinc-600 dark:text-zinc-400 ${isPanelVisible ? "pr-[90%] sm:pr-[350px] md:pr-[400px] lg:pr-[650px]" : ""}`}
			>
				{isAuthLoading ? (
					<p className="mb-1 flex items-center justify-center gap-2">
						<Loader2 size={12} className="animate-spin" />
						<span>Loading...</span>
					</p>
				) : (
					<p className="mb-1">
						{isAuthenticated || currentConversationId ? (
							<>
								AI can make mistakes.
								{!isMobile &&
									!isPanelVisible &&
									" Check relevant sources before making important decisions."}
							</>
						) : (
							<>
								By using Polychat, you agree to our{" "}
								<Link
									to="/terms"
									className="hover:text-zinc-800 dark:hover:text-zinc-200 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
								>
									Terms
								</Link>{" "}
								&{" "}
								<Link
									to="/privacy"
									className="hover:text-zinc-800 dark:hover:text-zinc-200 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
								>
									Privacy
								</Link>
								.
							</>
						)}
					</p>
				)}
			</div>

			<ArtifactPanel
				artifact={currentArtifact}
				onClose={handlePanelClose}
				isVisible={isPanelVisible}
			/>
		</div>
	);
};
