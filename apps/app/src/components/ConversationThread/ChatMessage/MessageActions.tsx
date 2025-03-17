import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import type { FC } from "react";

import type { Message } from "~/types";
import { MessageInfo } from "./MessageInfo";

interface MessageActionsProps {
	message: Message;
	copied: boolean;
	copyMessageToClipboard: () => void;
	feedbackState: "none" | "liked" | "disliked";
	isSubmittingFeedback: boolean;
	submitFeedback: (value: 1 | -1) => Promise<void>;
}

export const MessageActions: FC<MessageActionsProps> = ({
	message,
	copied,
	copyMessageToClipboard,
	feedbackState,
	isSubmittingFeedback,
	submitFeedback,
}) => {
	return (
		<div className="flex flex-wrap justify-end items-center gap-2">
			<div className="flex items-center space-x-1">
				{message.role !== "user" && message.content && (
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
				{message.role !== "user" && (message.created || message.timestamp) && (
					<div className="p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-600/50 rounded-lg text-zinc-500 dark:text-zinc-400">
						<MessageInfo message={message} />
					</div>
				)}
			</div>
			{message.role !== "user" && message.log_id && (
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
							feedbackState === "liked" ? "Feedback submitted" : "Thumbs up"
						}
						aria-label={
							feedbackState === "liked" ? "Feedback submitted" : "Thumbs up"
						}
					>
						<ThumbsUp size={14} />
					</button>
					<button
						type="button"
						onClick={() => submitFeedback(-1)}
						disabled={isSubmittingFeedback || feedbackState === "disliked"}
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
	);
};
