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
	private store?: boolean = true;

	private constructor(
		kvNamespace: KVNamespace,
		model?: string,
		platform?: Platform,
		store?: boolean,
	) {
		this.history = kvNamespace;
		if (model) {
			this.model = model;
		}
		this.platform = platform || "api";
		this.store = store ?? true;
	}

	public static getInstance({
		history,
		model,
		platform,
		store,
	}: {
		history: KVNamespace;
		model?: string;
		platform?: Platform;
		store?: boolean;
	}): ChatHistory {
		if (!ChatHistory.instance) {
			ChatHistory.instance = new ChatHistory(
				history,
				model,
				platform,
				store ?? true,
			);
		} else {
			ChatHistory.instance.history = history;
			ChatHistory.instance.model = model;
			ChatHistory.instance.platform = platform;
			ChatHistory.instance.store = store ?? true;
		}
		return ChatHistory.instance;
	}

	async add(completion_id: string, message: Message): Promise<Message> {
		const chat = await this.history.get(completion_id);
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
		if (this.store) {
			await this.history.put(completion_id, JSON.stringify(messages));
		}

		return newMessage;
	}

	async update(completion_id: string, messages: Message[]): Promise<void> {
		if (this.store) {
			await this.history.put(completion_id, JSON.stringify(messages));
		}
	}

	async get(completion_id: string, message?: Message): Promise<Message[]> {
		if (!this.store) {
			return message ? [message] : [];
		}

		const chat = await this.history.get(completion_id);
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
