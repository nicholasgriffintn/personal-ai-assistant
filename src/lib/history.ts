import { KVNamespaceListResult } from '@cloudflare/workers-types';

import { Message } from '../types';

export class ChatHistory {
	private static instance: ChatHistory;
	private kvNamespace: KVNamespace;
	private model?: string;
	private platform?: string;

	private constructor(kvNamespace: KVNamespace, model?: string, platform?: string) {
		this.kvNamespace = kvNamespace;
		if (model) {
			this.model = model;
		}
		if (platform) {
			this.platform = platform;
		}
	}

	public static getInstance(kvNamespace: KVNamespace, model?: string, platform?: string): ChatHistory {
		if (!ChatHistory.instance) {
			ChatHistory.instance = new ChatHistory(kvNamespace, model, platform);
		}
		return ChatHistory.instance;
	}

	async add(chatId: string, message: Message): Promise<Message> {
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
			platform: this.platform,
		};

		messages.push(newMessage);
		await this.kvNamespace.put(chatId, JSON.stringify(messages));

		return newMessage;
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
