import { KVNamespaceListResult } from '@cloudflare/workers-types';

type Message = {
	role: string;
	name?: string;
	tool_calls?: Record<string, any>[];
	content?: string;
};

export class ChatHistory {
	private static instance: ChatHistory;
	private kvNamespace: KVNamespace;
	private model: string;

	private constructor(kvNamespace: KVNamespace, model: string) {
		this.kvNamespace = kvNamespace;
		this.model = model;
	}

	public static getInstance(kvNamespace: KVNamespace, model: string): ChatHistory {
		if (!ChatHistory.instance) {
			ChatHistory.instance = new ChatHistory(kvNamespace, model);
		}
		return ChatHistory.instance;
	}

	async add(chatId: string, message: Message): Promise<void> {
		const chat = await this.kvNamespace.get(chatId);
		let messages: Message[] = [];

		if (chat) {
			const parsedChat = JSON.parse(chat);
			if (Array.isArray(parsedChat)) {
				messages = parsedChat;
			}
		}

		const newMessage = {
			...message,
			id: Math.random().toString(36).substring(7),
			timestamp: Date.now(),
			model: this.model,
		};

		messages.push(newMessage);
		await this.kvNamespace.put(chatId, JSON.stringify(messages));
	}

	async get(chatId: string): Promise<Message[]> {
		const chat = await this.kvNamespace.get(chatId);
		if (!chat) {
			return [];
		}
		return JSON.parse(chat);
	}

	async list(): Promise<KVNamespaceListResult<unknown, string>> {
		const keys = await this.kvNamespace.list();
		return keys;
	}
}
