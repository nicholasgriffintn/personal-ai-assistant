import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { Message } from "../types";
import { InfoTooltip } from "./InfoTooltip";

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
	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	const getMessageInfo = () => (
		<div className="space-y-2">
			<h4 className="font-medium text-zinc-900 dark:text-zinc-100">
				Message Information
			</h4>
			<div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
				<p>Time: {message.created ? formatDate(message.created) : "Unknown"}</p>
				<p>Model: {message.model || "Unknown"}</p>
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

	return (
		<div
			className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
		>
			<div
				className={`
					flex flex-col
					${
						message.role === "user"
							? "max-w-[80%] rounded-2xl border border-zinc-200/10 bg-zinc-100 text-black dark:bg-zinc-700 dark:text-white"
							: "dark:bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-full"
					}
				`}
			>
				<div className="flex items-start gap-2 px-3 py-2">
					<div className="flex-1">
						{message.reasoning && (
							<div className="mb-2">
								<button
									type="button"
									onClick={() =>
										setShowMessageReasoning(
											index,
											!message.reasoning!.collapsed,
										)
									}
									className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
								>
									{!message.reasoning.collapsed ? (
										<ChevronDown size={16} />
									) : (
										<ChevronRight size={16} />
									)}
									<span>Reasoning</span>
								</button>
								{!message.reasoning.collapsed && (
									<div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
										{message.reasoning.content}
									</div>
								)}
							</div>
						)}
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
							{message.content}
						</ReactMarkdown>
					</div>
					{message.created && (
						<InfoTooltip
							content={getMessageInfo()}
							buttonClassName="p-1.5 hover:bg-zinc-200/50 dark:hover:bg-zinc-600/50 rounded-lg text-zinc-500 dark:text-zinc-400 shrink-0"
							tooltipClassName="w-72 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg"
						/>
					)}
				</div>
			</div>
		</div>
	);
};
