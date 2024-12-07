import type { Message, MessageContent, Model } from '../types';

export function filterMessages(messageHistory: Message[]): Message[] {
	return messageHistory.filter((message) => message.content);
}

export function formatMessages(provider: string, systemPrompt: string, messageHistory: Message[], model?: string): Message[] {
	const cleanedMessageHistory = filterMessages(messageHistory);

	if (cleanedMessageHistory.length === 0) {
		return [];
	}

	const formatMessageContent = (content: string | MessageContent[], provider: string) => {
		if (!Array.isArray(content)) {
			return content;
		}

		switch (provider) {
			case 'google-ai-studio':
				return content.map((item) => {
					if (item.type === 'text') {
						return { text: item.text };
					}
					if (item.type === 'image_url' && item.image_url?.url) {
						return {
							inlineData: {
								mimeType: resolveType(item.image_url.url),
								data: getBase64FromUrl(item.image_url.url),
							},
						};
					}
					return item;
				});

			case 'anthropic':
				return content.map((item) => {
					if (item.type === 'text') {
						return { type: 'text', text: item.text };
					}
					if (item.type === 'image_url' && item.image_url?.url) {
						return {
							type: 'image',
							source: {
								type: 'base64',
								media_type: resolveType(item.image_url.url),
								data: getBase64FromUrl(item.image_url.url),
							},
						};
					}
					return item;
				});

			case 'bedrock':
				return content.map((item) => {
					if (item.type === 'text') {
						return { text: item.text };
					}
					return item;
				});

			case 'workers':
				return content
					.filter((item) => item.type === 'text')
					.map((item) => item.text)
					.join('\n');

			default:
				return content.map((item) => {
					if (item.type === 'text') {
						return { type: 'text', text: item.text };
					}
					if (item.type === 'image_url' && item.image_url?.url) {
						return { type: 'image_url', image_url: { url: item.image_url.url } };
					}
					return item;
				});
		}
	};

	const formattedMessages = cleanedMessageHistory.map((message) => {
		const formattedContent = formatMessageContent(message.content, provider);

		switch (provider) {
			case 'google-ai-studio':
				return {
					role: message.role,
					parts: Array.isArray(formattedContent) ? formattedContent : [{ text: formattedContent }],
				};

			default:
				return {
					role: message.role,
					content: formattedContent,
				};
		}
	});

	if (!systemPrompt) {
		return formattedMessages as Message[];
	}

	switch (provider) {
		case 'anthropic':
		case 'bedrock':
		case 'google-ai-studio':
			// These providers handle system prompt separately
			return formattedMessages as Message[];

		case 'openai':
			if (model === 'o1-preview' || model === 'o1-mini') {
				return formattedMessages as Message[];
			}

		case 'workers':
			return [
				{
					role: 'system',
					content: systemPrompt,
				},
				...formattedMessages,
			] as Message[];

		default:
			return [
				{
					role: 'system',
					content: [{ type: 'text', text: systemPrompt }],
				},
				...formattedMessages,
			] as Message[];
	}
}

export function resolveType(dataUrl: string): string {
	const match = dataUrl.match(/^data:([^;]+);base64,/);
	return match ? match[1] : 'application/octet-stream';
}

export function getBase64FromUrl(dataUrl: string): string {
	const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
	return base64Match ? base64Match[2] : dataUrl;
}
