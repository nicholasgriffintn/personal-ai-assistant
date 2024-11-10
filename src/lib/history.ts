type Message = {
	role: string;
	name?: string;
	tool_calls?: Record<string, any>[];
	content?: string;
};

export class ChatHistory {
	private static instance: ChatHistory;
	private kvNamespace: KVNamespace;

	private constructor(kvNamespace: KVNamespace) {
		this.kvNamespace = kvNamespace;
	}

	public static getInstance(kvNamespace: KVNamespace): ChatHistory {
		if (!ChatHistory.instance) {
			ChatHistory.instance = new ChatHistory(kvNamespace);
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

		messages.push(message);
		await this.kvNamespace.put(chatId, JSON.stringify(messages));
	}

	async get(chatId: string): Promise<Message[]> {
		const chat = await this.kvNamespace.get(chatId);
		if (!chat) {
			return [];
		}
		return JSON.parse(chat);
	}
}
