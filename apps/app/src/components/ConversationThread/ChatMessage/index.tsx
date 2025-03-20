import { useState } from "react";

import { apiService } from "~/lib/api-service";
import type { ChatRole, Message } from "~/types";
import { FunctionCallIcon } from "./FunctionCallMessage";
import { MessageActions } from "./MessageActions";
import { MessageContent } from "./MessageContent";
import { ToolIcon, ToolMessage } from "./ToolMessage";

export const ChatMessage = ({ message }: { message: Message }) => {
	console.log("ChatMessage", message);
	const [copied, setCopied] = useState(false);
	const [feedbackState, setFeedbackState] = useState<
		"none" | "liked" | "disliked"
	>("none");
	const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

	if (message.role === "assistant" && !message.tool_calls && !message.content) {
		return null;
	}

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
		if (!message.log_id || isSubmittingFeedback) return;

		setIsSubmittingFeedback(true);
		try {
			await apiService.submitFeedback(
				message.completion_id || "",
				message.log_id,
				value,
			);
			setFeedbackState(value === 1 ? "liked" : "disliked");
		} catch (error) {
			console.error("Failed to submit feedback:", error);
		} finally {
			setIsSubmittingFeedback(false);
		}
	};

	const isExternalFunctionCall =
		message.name === "External Functions" &&
		Array.isArray(message.tool_calls) &&
		message.tool_calls.length > 0;

	const isToolResponse = message.role === ("tool" as ChatRole) && message.name;

	const isSystemMessage =
		message.role === ("system" as ChatRole) ||
		message.role === ("developer" as ChatRole);

	if (isSystemMessage) {
		return null;
	}

	return (
		<div
			className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
			data-role={message.role}
			data-tool-response={isToolResponse}
			data-external-function-call={isExternalFunctionCall}
			data-tool-name={message.name}
			data-tool-status={message.status}
			data-id={message.id}
		>
			<div
				className={`
					flex flex-col
					${
						message.role === "user"
							? "max-w-[80%] rounded-2xl border border-zinc-200/10 bg-off-white-highlight text-black dark:bg-[#2D2D2D] dark:text-white"
							: "dark:bg-off-white-highlight dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-full"
					}
				`}
			>
				<div className="flex flex-col gap-2 px-3 py-2">
					<div className="flex items-start gap-2">
						{isToolResponse && (
							<div className="mt-1">
								{isExternalFunctionCall ? <FunctionCallIcon /> : <ToolIcon />}
							</div>
						)}
						<div className="flex-1 overflow-x-auto">
							{isToolResponse && <ToolMessage message={message} />}
							{(!isExternalFunctionCall || message.content) && (
								<MessageContent message={message} />
							)}
						</div>
					</div>

					{message.content && message.role !== "user" && message.log_id && (
						<MessageActions
							message={message}
							copied={copied}
							copyMessageToClipboard={copyMessageToClipboard}
							feedbackState={feedbackState}
							isSubmittingFeedback={isSubmittingFeedback}
							submitFeedback={submitFeedback}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatMessage;
