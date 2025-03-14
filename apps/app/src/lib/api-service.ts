import { apiKeyService } from "~/lib/api-key";
import type {
	ChatMode,
	ChatSettings,
	Conversation,
	Message,
	ModelConfig,
} from "~/types";
import { API_BASE_URL } from "../constants";

class ApiService {
	private static instance: ApiService;

	private constructor() {}

	public static getInstance(): ApiService {
		if (!ApiService.instance) {
			ApiService.instance = new ApiService();
		}
		return ApiService.instance;
	}

	public async getHeaders(): Promise<Record<string, string>> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		const apiKey = await apiKeyService.getApiKey();
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		return headers;
	}

	private getFetchOptions(
		method: string,
		headers: Record<string, string>,
		body?: any,
	): RequestInit {
		return {
			method,
			headers,
			credentials: "include",
			body: body ? JSON.stringify(body) : undefined,
		};
	}

	async listChats(): Promise<Conversation[]> {
		const headers = await this.getHeaders();

		try {
			const response = await fetch(
				`${API_BASE_URL}/chat/completions`,
				this.getFetchOptions("GET", headers),
			);

			if (!response.ok) {
				throw new Error(`Failed to list chats: ${response.statusText}`);
			}

			const data = (await response.json()) as {
				response: {
					keys: { name: string }[];
				};
			};

			if (
				!data.response ||
				!data.response.keys ||
				!Array.isArray(data.response.keys)
			) {
				console.error(
					"Unexpected response format from /chat/completions endpoint:",
					data,
				);
				return [];
			}

			const chatIds = data.response.keys.map(
				(key: { name: string }) => key.name,
			);

			const results: Conversation[] = [];
			const batchSize = 5;

			for (let i = 0; i < chatIds.length; i += batchSize) {
				const batch = chatIds.slice(i, i + batchSize);
				const batchPromises = batch.map(async (completion_id: string) => {
					try {
						return await this.getChat(completion_id);
					} catch (error) {
						console.error(`Failed to fetch chat ${completion_id}:`, error);
						return null;
					}
				});

				const batchResults = await Promise.all(batchPromises);
				results.push(
					...batchResults.filter(
						(result): result is Conversation => result !== null,
					),
				);
			}

			return results.sort((a, b) => {
				const aTimestamp =
					a.messages.length > 0
						? a.messages[a.messages.length - 1].created || 0
						: 0;
				const bTimestamp =
					b.messages.length > 0
						? b.messages[b.messages.length - 1].created || 0
						: 0;
				return bTimestamp - aTimestamp;
			});
		} catch (error) {
			console.error("Error listing chats:", error);
			return [];
		}
	}

	async getChat(completion_id: string): Promise<Conversation> {
		const headers = await this.getHeaders();

		const response = await fetch(
			`${API_BASE_URL}/chat/completions/${completion_id}`,
			this.getFetchOptions("GET", headers),
		);

		if (!response.ok) {
			throw new Error(`Failed to get chat: ${response.statusText}`);
		}

		const messages = await response.json();

		if (!Array.isArray(messages) || messages.length === 0) {
			return {
				id: completion_id,
				title: "New conversation",
				messages: [],
			};
		}

		const title = messages[0].data?.title
			? messages[0].data.title
			: `${messages[0].content.slice(0, 20)}...`;

		const transformedMessages = messages.map((msg: any) => {
			let content = msg.content;
			let reasoning = msg.reasoning;

			if (typeof content === "string") {
				const formatted = this.formatMessageContent(content);
				content = formatted.content;

				if (formatted.reasoning && !reasoning) {
					reasoning = formatted.reasoning;
				}
			} else if (content) {
				content = JSON.stringify(content);
			}

			return {
				...msg,
				role: msg.role,
				content: content,
				id: msg.id || crypto.randomUUID(),
				created: msg.timestamp || Date.now(),
				model: msg.model || "",
				citations: msg.citations || null,
				reasoning: reasoning
					? {
							collapsed: true,
							content: reasoning,
						}
					: undefined,
				logId: msg.logId,
			};
		});

		return {
			id: completion_id,
			title,
			messages: transformedMessages,
		};
	}

	private formatMessageContent(messageContent: string): {
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

	async generateTitle(
		completion_id: string,
		messages: Message[],
	): Promise<string> {
		const headers = await this.getHeaders();

		const formattedMessages = messages.map((msg) => ({
			role: msg.role,
			content: msg.content,
		}));

		const response = await fetch(
			`${API_BASE_URL}/chat/completions/${completion_id}/generate-title`,
			this.getFetchOptions("POST", headers, {
				completion_id,
				messages: formattedMessages,
			}),
		);

		if (!response.ok) {
			throw new Error(`Failed to generate title: ${response.statusText}`);
		}

		const data = (await response.json()) as any;
		return data.response.title;
	}

	async updateConversationTitle(
		completion_id: string,
		newTitle: string,
	): Promise<void> {
		const headers = await this.getHeaders();

		const updateResponse = await fetch(
			`${API_BASE_URL}/chat/completions/${completion_id}`,
			this.getFetchOptions("PUT", headers, {
				completion_id,
				title: newTitle,
			}),
		);

		if (!updateResponse.ok) {
			throw new Error(
				`Failed to update chat title: ${updateResponse.statusText}`,
			);
		}
	}

	async streamChatCompletions(
		completion_id: string,
		messages: Message[],
		model: string,
		mode: ChatMode,
		chatSettings: ChatSettings,
		signal: AbortSignal,
		onProgress: (text: string) => void,
		store = true,
	): Promise<Message> {
		const headers = await this.getHeaders();

		const filteredMessages = messages.filter((msg) => msg.role !== "tool");

		const formattedMessages = filteredMessages.map((msg) => {
			if (Array.isArray(msg.content)) {
				return {
					role: msg.role,
					content: msg.content,
				};
			}

			return {
				role: msg.role,
				content:
					typeof msg.content === "string"
						? msg.content
						: JSON.stringify(msg.content),
			};
		});

		const response = await fetch(`${API_BASE_URL}/chat/completions`, {
			...this.getFetchOptions("POST", headers, {
				completion_id,
				model,
				mode,
				messages: formattedMessages,
				platform: "web",
				response_mode: chatSettings.responseMode || "normal",
				store,
				...chatSettings,
			}),
			signal,
		});

		if (!response.ok) {
			throw new Error(
				`Failed to stream chat completions: ${response.statusText}`,
			);
		}

		const data = (await response.json()) as any;

		let content = "";
		let reasoning = "";

		for (const choice of data.choices) {
			if (choice.message.role === "assistant" && choice.message.content) {
				if (Array.isArray(choice.message.content)) {
					content = choice.message.content;
					const textContent = choice.message.content
						.filter(
							(item: { type: string; text?: string }) =>
								item.type === "text" && item.text,
						)
						.map((item: { text?: string }) => item.text || "")
						.join("\n");
					onProgress(textContent);
				} else {
					const messageContent = choice.message.content;
					const { content: formattedContent, reasoning: extractedReasoning } =
						this.formatMessageContent(messageContent);

					content = formattedContent;
					reasoning = extractedReasoning;
					onProgress(content);
				}
			} else if (choice.message.role === "tool") {
				content = choice.message.content;
				onProgress(content);
			}
		}

		return {
			role: "assistant",
			content,
			reasoning: reasoning
				? {
						collapsed: false,
						content: reasoning,
					}
				: undefined,
			id: data.id || crypto.randomUUID(),
			created: data.created || Date.now(),
			model: data.model || model,
			citations: data.choices[0]?.message.citations || null,
			usage: data.usage,
		};
	}

	async deleteConversation(completion_id: string): Promise<void> {
		const headers = await this.getHeaders();

		const response = await fetch(
			`${API_BASE_URL}/chat/completions/${completion_id}`,
			this.getFetchOptions("DELETE", headers),
		);

		if (!response.ok) {
			throw new Error(`Failed to delete chat: ${response.statusText}`);
		}
	}

	async submitFeedback(
		completion_id: string,
		logId: string,
		feedback: 1 | -1,
		score = 50,
	): Promise<void> {
		const headers = await this.getHeaders();

		const response = await fetch(
			`${API_BASE_URL}/chat/completions/${completion_id}/feedback`,
			this.getFetchOptions("POST", headers, {
				logId,
				feedback,
				score,
			}),
		);

		if (!response.ok) {
			throw new Error(`Failed to submit feedback: ${response.statusText}`);
		}
	}

	async fetchModels(): Promise<ModelConfig> {
		try {
			const response = await fetch(`${API_BASE_URL}/models`);
			if (!response.ok) {
				throw new Error(`Failed to fetch models: ${response.statusText}`);
			}
			const responseData = (await response.json()) as any;

			return responseData.data;
		} catch (error) {
			console.error("Error fetching models:", error);
			return {};
		}
	}

	async transcribeAudio(audioBlob: Blob): Promise<any> {
		const apiKey = await apiKeyService.getApiKey();

		if (!apiKey) {
			throw new Error("API key not found");
		}

		const headers = {
			Authorization: `Bearer ${apiKey}`,
			"X-User-Email": "anonymous@undefined.computer",
		};
		const formData = new FormData();
		formData.append("audio", audioBlob);

		const response = await fetch(`${API_BASE_URL}/chat/transcribe`, {
			method: "POST",
			headers,
			credentials: "include",
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Failed to transcribe audio: ${response.statusText}`);
		}

		return await response.json();
	}
}

export const apiService = ApiService.getInstance();
