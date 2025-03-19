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
				conversations: {
					id: string;
					title: string;
					messages: string[];
					last_message_at: string;
				}[];
			};

			if (!data.conversations || !Array.isArray(data.conversations)) {
				console.error(
					"Unexpected response format from /chat/completions endpoint:",
					data,
				);
				return [];
			}

			const results = data.conversations.map((conversation) => ({
				...conversation,
				messages: [],
				message_ids: conversation.messages,
			}));

			return results.sort((a, b) => {
				const aTimestamp = new Date(a.last_message_at).getTime();
				const bTimestamp = new Date(b.last_message_at).getTime();
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

		const conversation = (await response.json()) as any;

		if (!conversation.id) {
			return {
				id: completion_id,
				title: "New conversation",
				messages: [],
			};
		}

		const messages = conversation.messages;

		const title = conversation.title;

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
				log_id: msg.log_id,
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
		return data.title;
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
				stream: true,
				...chatSettings,
			}),
			signal,
		});

		if (!response.ok) {
			throw new Error(
				`Failed to stream chat completions: ${response.statusText}`,
			);
		}

		const isStreamingResponse = response.headers
			.get("content-type")
			?.includes("text/event-stream");

		if (!isStreamingResponse) {
			const data = (await response.json()) as any;

			let content = data.choices?.[0]?.message?.content || "";
			let reasoning = "";

			if (typeof content === "string") {
				const { content: formattedContent, reasoning: extractedReasoning } =
					this.formatMessageContent(content);
				content = formattedContent;
				reasoning = extractedReasoning;
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
				created: data.created ? data.created * 1000 : Date.now(),
				model: model,
				citations: data.citations || null,
				usage: data.usage || null,
			};
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error("Response body is not readable as a stream");
		}

		let content = "";
		let reasoning = "";
		const citations = null;
		let usage = null;
		let id = crypto.randomUUID();
		let created = Date.now();
		const decoder = new TextDecoder();
		let buffer = "";

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}

				const chunk = decoder.decode(value, { stream: true });
				buffer += chunk;

				const lines = buffer.split("\n\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					if (!line.trim()) continue;

					if (line.startsWith("data: ")) {
						const data = line.substring(6);

						if (data === "[DONE]") {
							continue;
						}

						try {
							const parsedData = JSON.parse(data);

							if (parsedData.choices && parsedData.choices.length > 0) {
								const choice = parsedData.choices[0];

								if (choice.delta && choice.delta.content !== undefined) {
									content += choice.delta.content;
									onProgress(content);
								}

								if (parsedData.id) {
									id = parsedData.id;
								}

								if (parsedData.created) {
									created = parsedData.created * 1000;
								}
							}

							if (parsedData.post_processing) {
								if (parsedData.usage) {
									usage = parsedData.usage;
								}
							}

							if (parsedData.response !== undefined) {
								content += parsedData.response;
								onProgress(content);
							}

							if (parsedData.usage && !usage) {
								usage = parsedData.usage;
							}
						} catch (e) {
							console.error("Error parsing SSE data:", e, data);
						}
					}
				}
			}
		} catch (error) {
			console.error("Error reading stream:", error);
			if (error instanceof Error && error.name !== "AbortError") {
				throw error;
			}
		} finally {
			reader.releaseLock();
		}

		if (content) {
			const { content: formattedContent, reasoning: extractedReasoning } =
				this.formatMessageContent(content);
			content = formattedContent;
			reasoning = extractedReasoning;

			onProgress(content);
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
			id: id,
			created: created,
			model: model,
			citations: citations || null,
			usage: usage,
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
		log_id: string,
		feedback: 1 | -1,
		score = 50,
	): Promise<void> {
		const headers = await this.getHeaders();

		const response = await fetch(
			`${API_BASE_URL}/chat/completions/${completion_id}/feedback`,
			this.getFetchOptions("POST", headers, {
				log_id,
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
