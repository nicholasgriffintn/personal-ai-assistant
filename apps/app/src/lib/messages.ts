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

	let cleanedContent = messageContent;

	cleanedContent = cleanedContent.replace(/<analysis>.*?<\/analysis>/gs, "");

	const answerRegex = /<answer>([\s\S]*?)(<\/answer>|$)/g;
	let match = answerRegex.exec(cleanedContent);
	while (match !== null) {
		const fullMatch = match[0];
		const contentOnly = match[1];
		cleanedContent = cleanedContent.replace(fullMatch, contentOnly);
		match = answerRegex.exec(cleanedContent);
	}

	cleanedContent = cleanedContent
		.replace(/<answer>/g, "")
		.replace(/<\/answer>/g, "")
		.trim();

	return {
		content: cleanedContent,
		reasoning,
	};
}

export const formattedMessageContent = (originalContent: string) => {
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

		const isStreaming = !analysisMatch[0].includes("</analysis>");
		reasoning.push({
			type: "analysis",
			content: analysisMatch[1].trim(),
			isOpen: isStreaming,
		});
		content = content.replace(analysisMatch[0], "");
	}

	const answerRegex = /<answer>([\s\S]*?)(<\/answer>|$)/g;
	while (true) {
		const answerMatch = answerRegex.exec(content);
		if (answerMatch === null) break;

		content = content.replace(answerMatch[0], answerMatch[1]);
	}

	return {
		content: content.trim(),
		reasoning,
	};
};
