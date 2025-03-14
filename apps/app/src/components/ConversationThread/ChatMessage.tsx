import {
	Check,
	ChevronDown,
	ChevronRight,
	Copy,
	Hammer,
	Terminal,
	ThumbsDown,
	ThumbsUp,
} from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { apiService } from "~/lib/api-service";
import type { ChatRole, Message, MessageContent } from "~/types";
import { InfoTooltip } from "../InfoTooltip";

interface ChatMessageProps {
	message: Message;
	index: number;
	setShowMessageReasoning: (index: number, showReasoning: boolean) => void;
}

export const ChatMessage: FC<ChatMessageProps> = ({
	message,
	index,
	setShowMessageReasoning,
}) => {
	const [copied, setCopied] = useState(false);
	const [feedbackState, setFeedbackState] = useState<
		"none" | "liked" | "disliked"
	>("none");
	const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

	if (message.role === "assistant" && !message.tool_calls && !message.content) {
		return null;
	}

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	const copyMessageToClipboard = () => {
		if (message.content) {
			const textContent =
				typeof message.content === "string"
					? message.content
					: message.content
							.filter((item) => item.type === "text")
							.map((item) => (item as any).text)
							.join("\n");

			navigator.clipboard
				.writeText(textContent)
				.then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				})
				.catch((err) => console.error("Failed to copy message: ", err));
		}
	};

	const submitFeedback = async (value: 1 | -1) => {
		if (!message.logId || isSubmittingFeedback) return;

		setIsSubmittingFeedback(true);
		try {
			await apiService.submitFeedback(
				message.completion_id || "",
				message.logId,
				value,
			);
			setFeedbackState(value === 1 ? "liked" : "disliked");
		} catch (error) {
			console.error("Failed to submit feedback:", error);
		} finally {
			setIsSubmittingFeedback(false);
		}
	};

	const getMessageInfo = () => (
		<div className="space-y-2">
			<h4 className="font-medium text-zinc-900 dark:text-zinc-100">
				Message Information
			</h4>
			<div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
				<p>
					Time:{" "}
					{message.created
						? formatDate(message.created)
						: message.timestamp
							? formatDate(message.timestamp)
							: "Unknown"}
				</p>
				<p>Model: {message.model || "Unknown"}</p>
				{message.platform && <p>Platform: {message.platform}</p>}
				{message.usage && (
					<div className="space-y-1">
						<p className="font-medium">Token Usage:</p>
						<ul className="list-disc pl-4 space-y-0.5">
							<li>Prompt: {message.usage.prompt_tokens}</li>
							<li>Completion: {message.usage.completion_tokens}</li>
							<li>Total: {message.usage.total_tokens}</li>
						</ul>
					</div>
				)}
			</div>
		</div>
	);

	const isExternalFunctionCall =
		message.name === "External Functions" &&
		message.tool_calls &&
		message.tool_calls.length > 0;

	const isToolResponse = message.role === ("tool" as ChatRole) && message.name;

	const renderMessageContent = () => {
		if (typeof message.content === "string") {
			let content = message.content;
			const reasoning = [];

			const thinkRegex = /<think>([\s\S]*?)(<\/think>|$)/g;

			while (true) {
				const match = thinkRegex.exec(content);
				if (match === null) break;

				reasoning.push({
					type: "think",
					content: match[1].trim(),
					isOpen: !match[0].includes("</think>"),
				});
				content = content.replace(match[0], "");
			}

			const analysisRegex = /<analysis>([\s\S]*?)(<\/analysis>|$)/g;
			let analysisMatch;

			while (true) {
				analysisMatch = analysisRegex.exec(content);
				if (analysisMatch === null) break;

				reasoning.push({
					type: "analysis",
					content: analysisMatch[1].trim(),
					isOpen: !analysisMatch[0].includes("</analysis>"),
				});
				content = content.replace(analysisMatch[0], "");
			}

			if (reasoning.length > 0) {
				message.reasoning = {
					content: reasoning.map((r) => r.content).join("\n\n"),
					collapsed: false,
				};
			}

			return (
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[rehypeHighlight]}
					className="prose dark:prose-invert prose-zinc"
					components={{
						table: ({ children }) => (
							<div className="overflow-x-scroll text-sm">{children}</div>
						),
					}}
				>
					{content.trim()}
				</ReactMarkdown>
			);
		}

		if (Array.isArray(message.content)) {
			return (
				<div className="space-y-4">
					{message.content.map((item: MessageContent, i: number) => {
						if (item.type === "text" && item.text) {
							return (
								<ReactMarkdown
									// biome-ignore lint/suspicious/noArrayIndexKey: It works
									key={`text-${i}`}
									remarkPlugins={[remarkGfm]}
									rehypePlugins={[rehypeHighlight]}
									className="prose dark:prose-invert prose-zinc"
									components={{
										table: ({ children }) => (
											<div className="overflow-x-scroll text-sm">
												{children}
											</div>
										),
									}}
								>
									{item.text}
								</ReactMarkdown>
							);
						}

						if (item.type === "image_url" && item.image_url) {
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: It works
								<div key={`image-${i}`} className="rounded-lg overflow-hidden">
									<img
										src={item.image_url.url}
										// biome-ignore lint/a11y/noRedundantAlt: This is a base64 image, we don't know what it is
										alt="User uploaded image"
										className="max-w-full max-h-[300px] object-contain"
									/>
								</div>
							);
						}
						return null;
					})}
				</div>
			);
		}
		return null;
	};

	return (
		<div
			className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
		>
			<div
				className={`
					flex flex-col
					${
						message.role === "user"
							? "max-w-[80%] rounded-2xl border border-zinc-200/10 bg-zinc-100 text-black dark:bg-[#2D2D2D] dark:text-white"
							: isExternalFunctionCall
								? "w-full rounded-lg border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
								: isToolResponse
									? "w-full rounded-lg border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200"
									: "dark:bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-full"
					}
				`}
			>
				<div className="flex flex-col gap-2 px-3 py-2">
					<div className="flex items-start gap-2">
						{(isExternalFunctionCall || isToolResponse) && (
							<div className="mt-1">
								{isExternalFunctionCall ? (
									<Hammer
										size={18}
										className="text-amber-600 dark:text-amber-400"
									/>
								) : (
									<Terminal
										size={18}
										className="text-blue-600 dark:text-blue-400"
									/>
								)}
							</div>
						)}
						<div className="flex-1 overflow-x-auto">
							{isExternalFunctionCall && (
								<div className="mb-2">
									<div className="text-xs font-medium text-amber-700 dark:text-amber-300">
										{message.name}
									</div>
									<div className="mt-1 space-y-2">
										{message.tool_calls?.map((tool, i) => (
											<div
												key={tool.id || i}
												className="rounded bg-amber-100/50 p-2 dark:bg-amber-900/20"
											>
												<div className="text-xs font-medium">
													{tool.function.name}
												</div>
												<pre className="mt-1 overflow-x-auto text-xs">
													{(() => {
														try {
															const args = tool.function.arguments;
															if (typeof args === "string") {
																return JSON.stringify(
																	JSON.parse(args),
																	null,
																	2,
																);
															}

															return JSON.stringify(args, null, 2);
														} catch (e) {
															return typeof tool.function.arguments === "string"
																? tool.function.arguments
																: JSON.stringify(tool.function.arguments);
														}
													})()}
												</pre>
											</div>
										))}
									</div>
								</div>
							)}
							{isToolResponse && (
								<div className="mb-2">
									<div className="text-xs font-medium text-blue-700 dark:text-blue-300">
										{message.name} {message.status && `(${message.status})`}
									</div>
									{message.data && (
										<pre className="mt-1 overflow-x-auto text-xs rounded bg-blue-100/50 p-2 dark:bg-blue-900/20">
											{(() => {
												try {
													return typeof message.data === "string"
														? message.data
														: JSON.stringify(message.data, null, 2);
												} catch (e) {
													return String(message.data);
												}
											})()}
										</pre>
									)}
								</div>
							)}
							{message.reasoning && (
								<div className="mb-2">
									<button
										type="button"
										onClick={() => {
											setShowMessageReasoning(
												index,
												message.reasoning!.collapsed,
											);
										}}
										className="cursor-pointer flex items-center text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
										aria-label="Toggle reasoning"
									>
										{!message.reasoning.collapsed ? (
											<ChevronDown size={16} />
										) : (
											<ChevronRight size={16} />
										)}
										<span>Reasoning</span>
									</button>
									{!message.reasoning.collapsed && (
										<div>
											<ReactMarkdown
												remarkPlugins={[remarkGfm]}
												className="prose dark:prose-invert prose-zinc prose-xs text-xs text-zinc-500 dark:text-zinc-400 mt-1"
												components={{
													table: ({ children }) => (
														<div className="overflow-x-scroll text-sm">
															{children}
														</div>
													),
												}}
											>
												{message.reasoning.content}
											</ReactMarkdown>
										</div>
									)}
								</div>
							)}
							{(!isExternalFunctionCall || message.content) &&
								renderMessageContent()}
							{message.data?.attachments?.map((attachment: any, i: number) => {
								if (attachment.type === "image") {
									return (
										// biome-ignore lint/suspicious/noArrayIndexKey: It works
										<div key={`attachment-${i}`}>
											<img src={attachment.url} alt="Attachment" />
										</div>
									);
								}
								return null;
							})}
						</div>
					</div>

					{(message.content ||
						(message.role === "assistant" && message.logId) ||
						message.created ||
						message.timestamp) && (
						<div className="flex flex-wrap justify-end items-center gap-2">
							<div className="flex items-center space-x-1">
								{message.role === "assistant" && message.content && (
									<button
										type="button"
										onClick={copyMessageToClipboard}
										className={`cursor-pointer p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-600/50 rounded-lg transition-colors duration-200 flex items-center ${
											copied
												? "text-green-500 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20"
												: "text-zinc-500 dark:text-zinc-400"
										}`}
										title={copied ? "Copied!" : "Copy message"}
										aria-label={copied ? "Copied!" : "Copy message"}
									>
										{copied ? <Check size={14} /> : <Copy size={14} />}
									</button>
								)}
								{message.role === "assistant" &&
									(message.created || message.timestamp) && (
										<div className="p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-600/50 rounded-lg text-zinc-500 dark:text-zinc-400">
											<InfoTooltip
												content={getMessageInfo()}
												buttonClassName="flex items-center"
												tooltipClassName="w-72 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg"
											/>
										</div>
									)}
							</div>
							{message.role === "assistant" && message.logId && (
								<div className="flex items-center space-x-1">
									<span className="text-xs text-zinc-500 dark:text-zinc-400">
										Helpful?
									</span>
									<button
										type="button"
										onClick={() => submitFeedback(1)}
										disabled={isSubmittingFeedback || feedbackState === "liked"}
										className={`cursor-pointer p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-600/50 rounded-lg transition-colors duration-200 ${
											feedbackState === "liked"
												? "text-green-500 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20"
												: "text-zinc-500 dark:text-zinc-400"
										} ${isSubmittingFeedback || feedbackState === "liked" ? "opacity-50 cursor-not-allowed" : ""}`}
										title={
											feedbackState === "liked"
												? "Feedback submitted"
												: "Thumbs up"
										}
										aria-label={
											feedbackState === "liked"
												? "Feedback submitted"
												: "Thumbs up"
										}
									>
										<ThumbsUp size={14} />
									</button>
									<button
										type="button"
										onClick={() => submitFeedback(-1)}
										disabled={
											isSubmittingFeedback || feedbackState === "disliked"
										}
										className={`cursor-pointer p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-600/50 rounded-lg transition-colors duration-200 ${
											feedbackState === "disliked"
												? "text-red-500 dark:text-red-400 bg-red-100/50 dark:bg-red-900/20"
												: "text-zinc-500 dark:text-zinc-400"
										} ${isSubmittingFeedback || feedbackState === "disliked" ? "opacity-50 cursor-not-allowed" : ""}`}
										title={
											feedbackState === "disliked"
												? "Feedback submitted"
												: "Thumbs down"
										}
										aria-label={
											feedbackState === "disliked"
												? "Feedback submitted"
												: "Thumbs down"
										}
									>
										<ThumbsDown size={14} />
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
