import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import type { Message, MessageContent as MessageContentType } from "~/types";
import { ReasoningSection } from "./ReasoningSection";

const formattedMessageContent = (originalContent: string) => {
	let content = originalContent;
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
	while (true) {
		const analysisMatch = analysisRegex.exec(content);
		if (analysisMatch === null) break;

		reasoning.push({
			type: "analysis",
			content: analysisMatch[1].trim(),
			isOpen: !analysisMatch[0].includes("</analysis>"),
		});
		content = content.replace(analysisMatch[0], "");
	}

	return {
		content: content.trim(),
		reasoning,
	};
};

interface MessageContentProps {
	message: Message;
}

const renderTextContent = (
	textContent: string,
	messageReasoning: Message["reasoning"] | undefined,
	key?: string,
): ReactNode => {
	const { content, reasoning } = formattedMessageContent(textContent);

	return (
		<>
			{(reasoning?.length > 0 || messageReasoning) && (
				<ReasoningSection
					reasoning={
						messageReasoning || {
							collapsed: true,
							content: reasoning.map((item) => item.content).join("\n"),
						}
					}
				/>
			)}
			<ReactMarkdown
				key={key}
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight]}
				className="prose dark:prose-invert prose-zinc"
				components={{
					table: ({ children }) => (
						<div className="overflow-x-scroll text-sm">{children}</div>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</>
	);
};

const renderImageContent = (imageUrl: string, index?: number): ReactNode => {
	return (
		<div
			key={index !== undefined ? `image-${index}` : undefined}
			className="rounded-lg overflow-hidden"
		>
			<img
				src={imageUrl}
				// biome-ignore lint/a11y/noRedundantAlt: we don't know what this is
				alt="User uploaded image"
				className="max-w-full max-h-[300px] object-contain"
			/>
		</div>
	);
};

export const MessageContent = ({ message }: MessageContentProps) => {
	if (typeof message.content === "string") {
		return renderTextContent(message.content, message.reasoning);
	}

	if (Array.isArray(message.content)) {
		return (
			<div className="space-y-4">
				{message.content.map((item: MessageContentType, i: number) => {
					if (item.type === "text" && item.text) {
						return renderTextContent(item.text, message.reasoning, `text-${i}`);
					}

					if (item.type === "image_url" && item.image_url) {
						return renderImageContent(item.image_url.url, i);
					}

					return null;
				})}
			</div>
		);
	}

	if (
		message.data &&
		"attachments" in message.data &&
		message.data.attachments
	) {
		return (
			<div className="space-y-4">
				{message.data.attachments.map((attachment: any, i: number) => {
					if (attachment.type === "image") {
						return renderImageContent(attachment.url, i);
					}
					return null;
				})}
			</div>
		);
	}

	return null;
};
