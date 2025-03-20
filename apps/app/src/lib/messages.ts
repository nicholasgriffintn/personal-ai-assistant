import type { Message } from "~/types";

export function normalizeMessage(message: Message): Message {
	let content = message.content;
	const reasoning = message.reasoning;
	let newReasoning = null;

	if (typeof content === "string") {
		const formatted = formatMessageContent(content);
		content = formatted.content;

		if (formatted.reasoning && !reasoning) {
			newReasoning = formatted.reasoning;
		}
	} else if (
		content &&
		!Array.isArray(content) &&
		typeof content === "object"
	) {
		content = JSON.stringify(content);
	}

	const now = Date.now();

	const finalReasoning = newReasoning
		? {
				collapsed: true,
				content: newReasoning,
			}
		: reasoning;

	return {
		...message,
		role: message.role,
		content: content,
		id: message.id || crypto.randomUUID(),
		created: message.created || message.timestamp || now,
		timestamp: message.timestamp || message.created || now,
		model: message.model || "",
		citations: message.citations || null,
		reasoning: finalReasoning,
		log_id: message.log_id,
		tool_calls: message.tool_calls,
		usage: message.usage,
		data: message.data,
		status: message.status,
	};
}

export function formatMessageContent(messageContent: string): {
	content: string;
	reasoning: string;
} {
	let reasoning = "";
	const analysisMatch = messageContent.match(/<analysis>(.*?)<\/analysis>/s);

	if (analysisMatch) {
		reasoning = analysisMatch[1].trim();
	}

	const cleanedContent = messageContent
		.replace(/<analysis>.*?<\/analysis>/gs, "")
		.replace(/<answer>.*?(<\/answer>)?/gs, "")
		.replace(/<answer>/g, "")
		.replace(/<\/answer>/g, "")
		.trim();

	return {
		content: cleanedContent,
		reasoning,
	};
}
