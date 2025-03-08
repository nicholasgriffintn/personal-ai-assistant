export type ChatRole = "user" | "assistant" | "system" | "tool";

export type ChatMode = "remote" | "local" | "prompt_coach" | "tool";

export type ResponseMode = "normal" | "concise" | "explanatory" | "formal";

export interface ChatSettings {
	temperature?: number;
	top_p?: number;
	max_tokens?: number;
	presence_penalty?: number;
	frequency_penalty?: number;
	useRAG?: boolean;
	responseMode?: ResponseMode;
	ragOptions?: {
		topK?: number;
		scoreThreshold?: number;
		includeMetadata?: boolean;
		type?: string;
		namespace?: string;
	};
}

export interface ChatModel {
	id: string;
	name: string;
	isLocal?: boolean;
	isFree?: boolean;
	description?: string;
	capabilities?: string[];
	defaultSettings?: ChatSettings;
}

export interface Message {
	role: ChatRole;
	content: string;
	reasoning?: {
		collapsed: boolean;
		content: string;
	};
	id: string;
	created?: number;
	timestamp?: number;
	model?: string;
	platform?: string;
	citations?: string[] | null;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	logId?: string;
	name?: string;
	tool_calls?: {
		id?: string;
		function: {
			name: string;
			arguments: string | {
				[key: string]: string;
			};
		};
		index?: number;
	}[];
	status?: string;
	data?: any;
}

export interface Conversation {
	id?: string;
	title: string;
	messages: Message[];
}

export type Theme = "light" | "dark" | "system";
