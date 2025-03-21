import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import { MemoizedMarkdown } from "~/components/ui/Markdown";
import { formattedMessageContent } from "~/lib/messages";
import type { Message, MessageContent as MessageContentType } from "~/types";
import { ArtifactComponent, type ArtifactProps } from "./ArtifactComponent";
import { ReasoningSection } from "./ReasoningSection";

interface MessageContentProps {
	message: Message;
	onArtifactOpen?: (artifact: ArtifactProps) => void;
}

const renderTextContent = (
	textContent: string,
	messageReasoning: Message["reasoning"] | undefined,
	onArtifactOpen?: (artifact: ArtifactProps) => void,
	key?: string,
): ReactNode => {
	const { content, reasoning, artifacts } =
		formattedMessageContent(textContent);

	const hasOpenReasoning = reasoning.some((item) => item.isOpen);

	const reasoningProps = messageReasoning || {
		collapsed: !hasOpenReasoning,
		content: reasoning.map((item) => item.content).join("\n"),
	};

	if (artifacts && artifacts.length > 0) {
		const artifactMap = new Map();
		for (const artifact of artifacts) {
			artifactMap.set(artifact.identifier, artifact);
		}

		const parts = content.split(/\[\[ARTIFACT:([^\]]+)\]\]/);

		const renderedParts: ReactNode[] = [];

		for (let i = 0; i < parts.length; i++) {
			if (i % 2 === 0) {
				if (parts[i]) {
					renderedParts.push(
						<MemoizedMarkdown key={`content-${i}`}>
							{parts[i]}
						</MemoizedMarkdown>,
					);
				}
			} else {
				const identifier = parts[i];
				const artifact = artifactMap.get(identifier);

				if (artifact) {
					renderedParts.push(
						<ArtifactComponent
							key={`artifact-${identifier}-${i}`}
							identifier={artifact.identifier}
							type={artifact.type}
							language={artifact.language}
							title={artifact.title}
							content={artifact.content}
							onOpen={onArtifactOpen}
						/>,
					);
				} else {
					console.warn(`No artifact found for identifier: ${identifier}`);
					renderedParts.push(`[[ARTIFACT:${identifier}]]`);
				}
			}
		}

		console.debug("Rendered parts count:", renderedParts.length);

		return (
			<>
				{(reasoning?.length > 0 || messageReasoning) && (
					<ReasoningSection reasoning={reasoningProps} />
				)}
				<div key={key} className="space-y-2">
					{renderedParts}
				</div>
			</>
		);
	}

	return (
		<>
			{(reasoning?.length > 0 || messageReasoning) && (
				<ReasoningSection reasoning={reasoningProps} />
			)}
			<MemoizedMarkdown key={key}>{content}</MemoizedMarkdown>
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

export const MessageContent = memo(
	({ message, onArtifactOpen }: MessageContentProps) => {
		const content = useMemo(() => {
			if (typeof message.content === "string") {
				return renderTextContent(
					message.content,
					message.reasoning,
					onArtifactOpen,
				);
			}

			if (Array.isArray(message.content)) {
				return (
					<div className="space-y-4">
						{message.content.map((item: MessageContentType, i: number) => {
							if (item.type === "text" && item.text) {
								return renderTextContent(
									item.text,
									message.reasoning,
									onArtifactOpen,
									`text-${i}`,
								);
							}

							if (item.type === "image_url" && item.image_url) {
								return renderImageContent(item.image_url.url, i);
							}

							if (item.type === "artifact" && item.artifact) {
								return (
									<ArtifactComponent
										key={`artifact-item-${item.artifact.identifier}`}
										identifier={item.artifact.identifier}
										type={item.artifact.type}
										language={item.artifact.language}
										title={item.artifact.title}
										content={item.artifact.content}
										onOpen={onArtifactOpen}
									/>
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
								return renderImageContent(attachment.url, i);
							}
							return null;
						})}
					</div>
				);
			}

			return null;
		}, [message.content, message.reasoning, message.data, onArtifactOpen]);

		return content;
	},
);
