import type { Message, MessageContent, ChatRole } from "../types";

interface MessageFormatOptions {
	maxTokens?: number;
	truncationStrategy?: "head" | "tail" | "middle";
	provider?: string;
	model?: string;
	systemPrompt?: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Static utility class
export class MessageFormatter {
	static formatMessages(
		messages: Message[],
		options: MessageFormatOptions = {},
	): Message[] {
		const {
			maxTokens = 0,
			truncationStrategy = "tail",
			provider = "default",
			model,
			systemPrompt,
		} = options;

		let formattedMessages = messages.filter((msg) => msg.content);

		if (
			maxTokens > 0 &&
			MessageFormatter.countTokens(formattedMessages) > maxTokens
		) {
			formattedMessages = MessageFormatter.truncateMessages(
				formattedMessages,
				maxTokens,
				truncationStrategy,
			);
		}

		formattedMessages = MessageFormatter.formatMessageContent(
			formattedMessages,
			provider,
		);

		if (systemPrompt) {
			formattedMessages = MessageFormatter.addSystemPrompt(
				formattedMessages,
				systemPrompt,
				provider,
				model,
			);
		}

		return formattedMessages;
	}

	private static formatMessageContent(
		messages: Message[],
		provider: string,
	): Message[] {
		return messages.map((message) => {
			const content = MessageFormatter.formatContent(message.content, provider);

			switch (provider) {
				case "google-ai-studio":
					return {
						role: message.role,
						parts: Array.isArray(content) ? content : [{ text: content }],
						content: "",
					};
				default:
					return {
						role: message.role,
						content,
					};
			}
		});
	}

	private static formatContent(
		content: Message["content"],
		provider: string,
	): any {
		if (!Array.isArray(content)) {
			return content;
		}

		switch (provider) {
			case "google-ai-studio":
				return content.map((item) =>
					MessageFormatter.formatGoogleAIContent(item),
				);
			case "anthropic":
				return content.map((item) =>
					MessageFormatter.formatAnthropicContent(item),
				);
			case "bedrock":
				return content.map((item) =>
					MessageFormatter.formatBedrockContent(item),
				);
			case "workers":
			case "ollama":
			case "github-models": {
				const imageItem = content.find((item) => item.type === "image_url");
				if (imageItem?.image_url?.url) {
					return {
						text: content
							.filter((item) => item.type === "text")
							.map((item) => item.text)
							.join("\n"),
						image: MessageFormatter.getBase64FromUrl(imageItem.image_url.url),
					};
				}

				return content
					.filter((item) => item.type === "text")
					.map((item) => item.text)
					.join("\n");
			}
			default:
				return content;
		}
	}

	private static addSystemPrompt(
		messages: Message[],
		systemPrompt: string,
		provider: string,
		model?: string,
	): Message[] {
		if (!systemPrompt) {
			return messages;
		}

		switch (provider) {
			case "anthropic":
			case "bedrock":
			case "google-ai-studio":
				return messages;
			case "openai":
				if (model === "o1-preview" || model === "o1-mini") {
					return messages;
				}
				return [
					{ role: "developer" as ChatRole, content: systemPrompt },
					...messages,
				];
			case "workers":
			case "groq":
			case "ollama":
			case "github-models":
				return [
					{
						role: "system",
						content: systemPrompt,
					},
					...messages,
				] as Message[];
			default:
				return [
					{
						role: "system" as ChatRole,
						content: [{ type: "text", text: systemPrompt }],
					},
					...messages,
				];
		}
	}

	private static countTokens(messages: Message[]): number {
		return messages.reduce(
			(total, msg) =>
				total +
				(typeof msg.content === "string"
					? msg.content.length
					: JSON.stringify(msg.content).length),
			0,
		);
	}

	private static truncateMessages(
		messages: Message[],
		maxTokens: number,
		strategy: "head" | "tail" | "middle",
	): Message[] {
		switch (strategy) {
			case "tail":
				return messages.slice(-Math.floor(messages.length / 2));
			case "head":
				return messages.slice(0, Math.floor(messages.length / 2));
			case "middle": {
				const midPoint = Math.floor(messages.length / 2);
				return messages.slice(
					midPoint - Math.floor(maxTokens / 2),
					midPoint + Math.floor(maxTokens / 2),
				);
			}
		}
	}

	private static formatGoogleAIContent(item: MessageContent): any {
		if (item.type === "text") {
			return { text: item.text };
		}
		if (item.type === "image_url" && item.image_url?.url) {
			return {
				inlineData: {
					mimeType: MessageFormatter.resolveType(item.image_url.url),
					data: MessageFormatter.getBase64FromUrl(item.image_url.url),
				},
			};
		}
		return item;
	}

	private static formatAnthropicContent(item: MessageContent): any {
		if (item.type === "text") {
			return { type: "text", text: item.text };
		}
		if (item.type === "image_url" && item.image_url?.url) {
			return {
				type: "image",
				source: {
					type: "base64",
					media_type: MessageFormatter.resolveType(item.image_url.url),
					data: MessageFormatter.getBase64FromUrl(item.image_url.url),
				},
			};
		}
		return item;
	}

	private static formatBedrockContent(item: MessageContent): any {
		if (item.type === "text") {
			return { text: item.text };
		}
		return item;
	}

	private static resolveType(dataUrl: string): string {
		const match = dataUrl.match(/^data:([^;]+);base64,/);
		return match ? match[1] : "application/octet-stream";
	}

	private static getBase64FromUrl(dataUrl: string): string {
		const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
		return base64Match ? base64Match[2] : dataUrl;
	}
}
