import type {
	KVNamespace,
	KVNamespaceListResult,
} from "@cloudflare/workers-types";

import type { Message, Platform } from "../types";

export class ChatHistory {
	private static instance: ChatHistory;
	private history: KVNamespace;
	private model?: string;
	private platform?: Platform;
	private shouldSave?: boolean = true;

	private constructor(
		kvNamespace: KVNamespace,
		model?: string,
		platform?: Platform,
		shouldSave?: boolean,
	) {
		this.history = kvNamespace;
		if (model) {
			this.model = model;
		}
		this.platform = platform || "api";
		this.shouldSave = shouldSave ?? true;
	}

	public static getInstance({
		history,
		model,
		platform,
		shouldSave,
	}: {
		history: KVNamespace;
		model?: string;
		platform?: Platform;
		shouldSave?: boolean;
	}): ChatHistory {
		if (!ChatHistory.instance) {
			ChatHistory.instance = new ChatHistory(
				history,
				model,
				platform,
				shouldSave ?? true,
			);
		} else {
			ChatHistory.instance.history = history;
			ChatHistory.instance.model = model;
			ChatHistory.instance.platform = platform;
			ChatHistory.instance.shouldSave = shouldSave ?? true;
		}
		return ChatHistory.instance;
	}

	async add(chatId: string, message: Message): Promise<Message> {
		const chat = await this.history.get(chatId);
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
		if (this.shouldSave) {
			await this.history.put(chatId, JSON.stringify(messages));
		}

		return newMessage;
	}

	async update(chatId: string, messages: Message[]): Promise<void> {
		if (this.shouldSave) {
			await this.history.put(chatId, JSON.stringify(messages));
		}
	}

	async get(chatId: string, message?: Message): Promise<Message[]> {
		if (!this.shouldSave) {
			return message ? [message] : [];
		}

		const chat = await this.history.get(chatId);
		if (!chat) {
			return [];
		}
		return JSON.parse(chat);
	}

	async list(): Promise<KVNamespaceListResult<unknown, string>> {
		const keys = await this.history.list();
		return keys;
	}
}
