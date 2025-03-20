import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import { Markdown } from "~/components/ui/Markdown";
import { formattedMessageContent } from "~/lib/messages";
import type { Message, MessageContent as MessageContentType } from "~/types";
import { ReasoningSection } from "./ReasoningSection";

interface MessageContentProps {
	message: Message;
}

const MemoizedMarkdown = memo(
	({ content, key }: { content: string; key?: string }) => (
		<Markdown key={key}>{content}</Markdown>
	),
);

const renderTextContent = (
	textContent: string,
	messageReasoning: Message["reasoning"] | undefined,
	key?: string,
): ReactNode => {
	const { content, reasoning } = formattedMessageContent(textContent);

	const hasOpenReasoning = reasoning.some((item) => item.isOpen);

	const reasoningProps = messageReasoning || {
		collapsed: !hasOpenReasoning,
		content: reasoning.map((item) => item.content).join("\n"),
	};

	return (
		<>
			{(reasoning?.length > 0 || messageReasoning) && (
				<ReasoningSection reasoning={reasoningProps} />
			)}
			<MemoizedMarkdown content={content} key={key} />
		</>
	);
};

const MemoizedImage = memo(
	({ imageUrl, index }: { imageUrl: string; index?: number }) => (
		<div
			key={index !== undefined ? `image-${index}` : undefined}
			className="rounded-lg overflow-hidden"
		>
			<img
				src={imageUrl}
				alt="User uploaded content in conversation"
				className="max-w-full max-h-[300px] object-contain"
			/>
		</div>
	),
);

const renderImageContent = (imageUrl: string, index?: number): ReactNode => {
	return <MemoizedImage imageUrl={imageUrl} index={index} />;
};

export const MessageContent = memo(({ message }: MessageContentProps) => {
	const content = useMemo(() => {
		if (typeof message.content === "string") {
			return renderTextContent(message.content, message.reasoning);
		}

		if (Array.isArray(message.content)) {
			return (
				<div className="space-y-4">
					{message.content.map((item: MessageContentType, i: number) => {
						if (item.type === "text" && item.text) {
							return renderTextContent(
								item.text,
								message.reasoning,
								`text-${i}`,
							);
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
	}, [message.content, message.reasoning, message.data]);

	return content;
});
