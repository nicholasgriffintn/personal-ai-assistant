import type { D1Database } from "@cloudflare/workers-types";

import type { Message, MessageContent, Platform } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { Database } from "./database";

export class ConversationManager {
	private static instance: ConversationManager;
	private db: Database;
	private model?: string;
	private platform?: Platform;
	private store?: boolean = true;
	private userId?: number;

	private constructor(
		db: Database,
		userId?: number,
		model?: string,
		platform?: Platform,
		store?: boolean,
	) {
		this.db = db;
		this.userId = userId;
		this.model = model;
		this.platform = platform || "api";
		this.store = store ?? true;
	}

	public static getInstance({
		database,
		userId,
		model,
		platform,
		store,
	}: {
		database: D1Database;
		userId?: number;
		model?: string;
		platform?: Platform;
		store?: boolean;
	}): ConversationManager {
		const db = Database.getInstance(database);

		if (!ConversationManager.instance) {
			ConversationManager.instance = new ConversationManager(
				db,
				userId,
				model,
				platform,
				store ?? true,
			);
		} else {
			ConversationManager.instance.db = db;
			ConversationManager.instance.userId = userId;
			ConversationManager.instance.model = model;
			ConversationManager.instance.platform = platform;
			ConversationManager.instance.store = store ?? true;
		}

		return ConversationManager.instance;
	}

	/**
	 * Add a message to a conversation
	 * If the conversation doesn't exist, it will be created
	 */
	async add(conversation_id: string, message: Message): Promise<Message> {
		if (!this.store) {
			return {
				...message,
				id: message.id || this.generateId(),
				timestamp: message.timestamp || Date.now(),
				model: message.model || this.model,
				platform: message.platform || this.platform,
			};
		}

		if (!this.userId) {
			throw new AssistantError(
				"User ID is required to store conversations",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		let conversation = await this.db.getConversation(conversation_id);

		if (!conversation) {
			conversation = await this.db.createConversation(
				conversation_id,
				this.userId,
				"New Conversation",
			);
		} else if (conversation.user_id !== this.userId) {
			throw new AssistantError(
				"You don't have permission to update this conversation",
				ErrorType.FORBIDDEN,
			);
		}

		const newMessage = {
			...message,
			id: message.id || this.generateId(),
			timestamp: message.timestamp || Date.now(),
			model: message.model || this.model,
			platform: message.platform || this.platform,
		};

		let content: string;
		if (typeof newMessage.content === "object") {
			content = JSON.stringify(newMessage.content);
		} else {
			content = newMessage.content || "";
		}

		const messageOptions: Record<string, unknown> = {
			model: newMessage.model,
			status: newMessage.status,
			timestamp: newMessage.timestamp,
			platform: newMessage.platform,
			mode: newMessage.mode,
			log_id: newMessage.log_id,
		};

		await this.db.createMessage(
			newMessage.id as string,
			conversation_id,
			newMessage.role,
			content,
			messageOptions,
		);

		await this.db.updateConversationAfterMessage(
			conversation_id,
			newMessage.id as string,
		);

		return newMessage;
	}

	/**
	 * Update existing messages in a conversation
	 */
	async update(conversation_id: string, messages: Message[]): Promise<void> {
		if (!this.store) {
			return;
		}

		if (!this.userId) {
			throw new AssistantError(
				"User ID is required to update messages",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		const conversation = await this.db.getConversation(conversation_id);
		if (!conversation) {
			throw new AssistantError("Conversation not found", ErrorType.NOT_FOUND);
		}

		if (conversation.user_id !== this.userId) {
			throw new AssistantError(
				"You don't have permission to update this conversation",
				ErrorType.FORBIDDEN,
			);
		}

		for (const message of messages) {
			if (!message.id) {
				continue;
			}

			let content: string | undefined;
			if (typeof message.content === "object") {
				content = JSON.stringify(message.content);
			} else {
				content = message.content;
			}

			const updates: Record<string, unknown> = {};
			if (content !== undefined) {
				updates.content = content;
			}

			for (const [key, value] of Object.entries(message)) {
				if (!["id", "content"].includes(key)) {
					updates[key] = value;
				}
			}

			if (Object.keys(updates).length > 0) {
				await this.db.updateMessage(message.id, updates);
			}
		}
	}

	/**
	 * Get all messages in a conversation
	 */
	async get(
		conversation_id: string,
		message?: Message,
		limit?: number,
		after?: string,
	): Promise<Message[]> {
		if (!this.store) {
			return message ? [message] : [];
		}

		if (!this.userId) {
			throw new AssistantError(
				"User ID is required to retrieve messages",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		const conversation = await this.db.getConversation(conversation_id);
		if (!conversation) {
			throw new AssistantError("Conversation not found", ErrorType.NOT_FOUND);
		}

		if (conversation.user_id !== this.userId) {
			throw new AssistantError(
				"You don't have permission to access this conversation",
				ErrorType.FORBIDDEN,
			);
		}

		const messages = await this.db.getConversationMessages(
			conversation_id,
			limit,
			after,
		);

		return messages.map((dbMessage) => {
			let content: string | MessageContent[] = dbMessage.content as string;

			try {
				if (
					typeof content === "string" &&
					(content.startsWith("[") || content.startsWith("{"))
				) {
					const parsed = JSON.parse(content);
					content = parsed;
				}
			} catch (e) {
				console.error(e);
			}

			return {
				id: dbMessage.id,
				role: dbMessage.role,
				content,
				model: dbMessage.model,
				name: dbMessage.name,
				tool_calls: dbMessage.tool_calls
					? JSON.parse(dbMessage.tool_calls as string)
					: undefined,
				citations: dbMessage.citations
					? JSON.parse(dbMessage.citations as string)
					: undefined,
				status: dbMessage.status,
				timestamp: dbMessage.timestamp,
				platform: dbMessage.platform,
				mode: dbMessage.mode,
				data: dbMessage.data ? JSON.parse(dbMessage.data as string) : undefined,
				log_id: dbMessage.log_id,
			} as Message;
		});
	}

	/**
	 * Get a list of conversation IDs
	 */
	async list(
		limit = 25,
		page = 1,
		includeArchived = false,
	): Promise<{
		conversations: Record<string, unknown>[];
		totalPages: number;
		pageNumber: number;
		pageSize: number;
	}> {
		if (!this.userId) {
			throw new AssistantError(
				"User ID is required to list conversations",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		const result = await this.db.getUserConversations(
			this.userId,
			limit,
			page,
			includeArchived,
		);

		const conversations = result.conversations.map((conversation) => {
			const messagesString = conversation.messages as string;

			return {
				...conversation,
				messages: messagesString ? messagesString.split(",") : [],
			};
		});

		return {
			...result,
			conversations,
		};
	}

	/**
	 * Get conversation details
	 */
	async getConversationDetails(
		conversation_id: string,
	): Promise<Record<string, unknown>> {
		if (!this.userId) {
			throw new AssistantError(
				"User ID is required to get conversation details",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		const conversation = await this.db.getConversation(conversation_id);
		if (!conversation) {
			throw new AssistantError("Conversation not found", ErrorType.NOT_FOUND);
		}

		if (conversation.user_id !== this.userId) {
			throw new AssistantError(
				"You don't have permission to access this conversation",
				ErrorType.FORBIDDEN,
			);
		}

		return conversation;
	}

	/**
	 * Update conversation properties
	 */
	async updateConversation(
		conversation_id: string,
		updates: {
			title?: string;
			archived?: boolean;
		},
	): Promise<Record<string, unknown>> {
		if (!this.store) {
			return {};
		}

		if (!this.userId) {
			throw new AssistantError(
				"User ID is required to update a conversation",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		const conversation = await this.db.getConversation(conversation_id);
		if (!conversation) {
			throw new AssistantError("Conversation not found", ErrorType.NOT_FOUND);
		}

		if (conversation.user_id !== this.userId) {
			throw new AssistantError(
				"You don't have permission to update this conversation",
				ErrorType.FORBIDDEN,
			);
		}

		const updateObj: Record<string, unknown> = {};

		if (updates.title !== undefined) {
			updateObj.title = updates.title;
		}

		if (updates.archived !== undefined) {
			updateObj.is_archived = updates.archived;
		}

		await this.db.updateConversation(conversation_id, updateObj);

		const updatedConversation = await this.db.getConversation(conversation_id);
		return updatedConversation || {};
	}

	/**
	 * Get a message by its ID
	 */
	async getMessageById(
		message_id: string,
	): Promise<{ message: Message; conversation_id: string }> {
		if (!this.userId) {
			throw new AssistantError(
				"User ID is required to retrieve a message",
				ErrorType.AUTHENTICATION_ERROR,
			);
		}

		const result = await this.db.getMessageById(message_id);

		if (!result) {
			throw new AssistantError("Message not found", ErrorType.NOT_FOUND);
		}

		if (result.user_id !== this.userId) {
			throw new AssistantError(
				"You don't have permission to access this message",
				ErrorType.FORBIDDEN,
			);
		}

		const dbMessage = result.message;
		let content: string | MessageContent[] = dbMessage.content as string;

		try {
			if (
				typeof content === "string" &&
				(content.startsWith("[") || content.startsWith("{"))
			) {
				const parsed = JSON.parse(content);
				content = parsed;
			}
		} catch (e) {
			console.error(e);
		}

		const message = {
			id: dbMessage.id,
			role: dbMessage.role,
			content,
			model: dbMessage.model,
			name: dbMessage.name,
			tool_calls: dbMessage.tool_calls
				? JSON.parse(dbMessage.tool_calls as string)
				: undefined,
			citations: dbMessage.citations
				? JSON.parse(dbMessage.citations as string)
				: undefined,
			status: dbMessage.status,
			timestamp: dbMessage.timestamp,
			platform: dbMessage.platform,
			mode: dbMessage.mode,
			data: dbMessage.data ? JSON.parse(dbMessage.data as string) : undefined,
			log_id: dbMessage.log_id,
		} as Message;

		return {
			message,
			conversation_id: result.conversation_id,
		};
	}

	/**
	 * Get messages for a webhook (no user authentication required)
	 * This method is specifically for external service callbacks
	 */
	async getFromWebhook(conversation_id: string): Promise<Message[]> {
		if (!this.store) {
			return [];
		}

		const conversation = await this.db.getConversation(conversation_id);
		if (!conversation) {
			throw new AssistantError("Conversation not found", ErrorType.NOT_FOUND);
		}

		const messages = await this.db.getConversationMessages(conversation_id);

		return messages.map((dbMessage) => {
			let content: string | MessageContent[] = dbMessage.content as string;

			try {
				if (
					typeof content === "string" &&
					(content.startsWith("[") || content.startsWith("{"))
				) {
					const parsed = JSON.parse(content);
					content = parsed;
				}
			} catch (e) {
				console.error(e);
			}

			return {
				id: dbMessage.id,
				role: dbMessage.role,
				content,
				model: dbMessage.model,
				name: dbMessage.name,
				tool_calls: dbMessage.tool_calls
					? JSON.parse(dbMessage.tool_calls as string)
					: undefined,
				citations: dbMessage.citations
					? JSON.parse(dbMessage.citations as string)
					: undefined,
				status: dbMessage.status,
				timestamp: dbMessage.timestamp,
				platform: dbMessage.platform,
				mode: dbMessage.mode,
				data: dbMessage.data ? JSON.parse(dbMessage.data as string) : undefined,
				log_id: dbMessage.log_id,
			} as Message;
		});
	}

	/**
	 * Update messages for a webhook (no user authentication required)
	 * This method is specifically for external service callbacks
	 */
	async updateFromWebhook(
		conversation_id: string,
		messages: Message[],
	): Promise<void> {
		if (!this.store) {
			return;
		}

		const conversation = await this.db.getConversation(conversation_id);
		if (!conversation) {
			throw new AssistantError("Conversation not found", ErrorType.NOT_FOUND);
		}

		for (const message of messages) {
			if (!message.id) {
				continue;
			}

			let content: string | undefined;
			if (typeof message.content === "object") {
				content = JSON.stringify(message.content);
			} else {
				content = message.content;
			}

			const updates: Record<string, unknown> = {};
			if (content !== undefined) {
				updates.content = content;
			}

			for (const [key, value] of Object.entries(message)) {
				if (!["id", "content"].includes(key)) {
					updates[key] = value;
				}
			}

			if (Object.keys(updates).length > 0) {
				await this.db.updateMessage(message.id, updates);
			}
		}
	}

	/**
	 * Generate a random ID for messages
	 */
	private generateId(): string {
		return Math.random().toString(36).substring(2, 7);
	}
}
