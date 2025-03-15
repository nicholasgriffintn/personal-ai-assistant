import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import type { Message, MessageContent as MessageContentType } from "~/types";

interface MessageContentProps {
	message: Message;
}

export const MessageContent: FC<MessageContentProps> = ({ message }) => {
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
				{message.content.map((item: MessageContentType, i: number) => {
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
										<div className="overflow-x-scroll text-sm">{children}</div>
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

	if (
		message.data &&
		"attachments" in message.data &&
		message.data.attachments
	) {
		return (
			<div className="space-y-4">
				{message.data.attachments.map((attachment: any, i: number) => {
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
		);
	}

	return null;
};
