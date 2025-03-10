import { MessageFormatter } from "../lib/formatter";
import type { Message } from "../types";

export function filterMessages(messageHistory: Message[]): Message[] {
	return messageHistory.filter((message) => message.content);
}

export function formatMessages(
	provider: string,
	messageHistory: Message[],
	system_prompt?: string,
	model?: string,
): Message[] {
	return MessageFormatter.formatMessages(messageHistory, {
		provider,
		model,
		system_prompt,
		maxTokens: 0,
		truncationStrategy: "tail",
	});
}

export function resolveType(dataUrl: string): string {
	const match = dataUrl.match(/^data:([^;]+);base64,/);
	return match ? match[1] : "application/octet-stream";
}

export function getBase64FromUrl(dataUrl: string): string {
	const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
	return base64Match ? base64Match[2] : dataUrl;
}
