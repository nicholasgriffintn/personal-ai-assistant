import type {
	Ai,
	D1Database,
	Vectorize,
	AnalyticsEngineDataset,
} from "@cloudflare/workers-types";

import type { availableCapabilities } from "./lib/models";

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
	T,
	Exclude<keyof T, Keys>
> &
	{
		[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
	}[Keys];

export type ModelConfig = {
	[key: string]: {
		matchingModel: string;
		provider: string;
		type: string | string[];
		isBeta?: boolean;
		supportsFunctions?: boolean;
		isFree?: boolean;
	};
};

export type Platform = "web" | "mobile" | "api";

export interface IEnv {
	ANALYTICS: AnalyticsEngineDataset;
	AI: Ai;
	VECTOR_DB: Vectorize;
	DB: D1Database;
	ASSETS_BUCKET: any;
	ACCOUNT_ID: string;
	ANTHROPIC_API_KEY?: string;
	AI_GATEWAY_TOKEN?: string;
	GROK_API_KEY?: string;
	HUGGINGFACE_TOKEN?: string;
	PERPLEXITY_API_KEY?: string;
	CHAT_HISTORY?: any;
	REPLICATE_API_TOKEN?: string;
	WEBHOOK_SECRET?: string;
	ASSETS_BUCKET_ACCESS_KEY_ID: string;
	ASSETS_BUCKET_SECRET_ACCESS_KEY: string;
	MISTRAL_API_KEY?: string;
	OPENROUTER_API_KEY?: string;
	BEDROCK_AWS_ACCESS_KEY?: string;
	BEDROCK_AWS_SECRET_KEY?: string;
	BEDROCK_GUARDRAIL_ID: string;
	BEDROCK_GUARDRAIL_VERSION?: string;
	AWS_REGION?: string;
	GUARDRAILS_ENABLED?: string;
	GUARDRAILS_PROVIDER?: string;
	OPENAI_API_KEY?: string;
	GOOGLE_STUDIO_API_KEY?: string;
	EMBEDDING_PROVIDER?: string;
	BEDROCK_KNOWLEDGE_BASE_ID?: string;
	BEDROCK_KNOWLEDGE_BASE_CUSTOM_DATA_SOURCE_ID?: string;
	GROQ_API_KEY?: string;
	ANALYTICS_API_KEY?: string;
	OLLAMA_ENABLED?: string;
	OLLAMA_URL?: string;
	GITHUB_MODELS_API_TOKEN?: string;
	POLLY_ACCESS_KEY_ID?: string;
	POLLY_SECRET_ACCESS_KEY?: string;
	DEEPSEEK_API_KEY?: string;
	TAVILY_API_KEY?: string;
	BROWSER_RENDERING_API_KEY?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	ACCESS_TOKEN?: string;
	JWT_SECRET?: string;
	AUTH_REDIRECT_URL?: string;
	ALLOWED_USERNAMES?: string;
}

export type ContentType = "text" | "image_url" | "audio_url";
export type ChatRole = "user" | "assistant" | "tool" | "developer";
export type ChatMode =
	| "normal"
	| "local"
	| "remote"
	| "prompt_coach"
	| "no_system";

export type ResponseMode = "normal" | "concise" | "explanatory" | "formal";

export type MessageContent = {
	type: ContentType;
	text?: string;
	image_url?: {
		url: string;
	};
	audio_url?: {
		url: string;
	};
};

export type Attachment = {
	type: "image";
	url: string;
	detail?: "low" | "high";
};

export interface Message {
	role: ChatRole;
	name?: string;
	tool_calls?: Record<string, any>[];
	parts?: {
		text: string;
	}[];
	content: string | MessageContent[];
	status?: string;
	data?: Record<string, any>;
	model?: string;
	logId?: string;
	citations?: string[];
	app?: string;
	mode?: ChatMode;
	id?: string;
	timestamp?: number;
	platform?: Platform;
}

export type ChatInput = string | { prompt: string };

export interface IBody {
	chat_id: string;
	input: ChatInput;
	attachments?: Attachment[];
	date: string;
	location?: {
		latitude?: number;
		longitude?: number;
	};
	model?: string;
	platform?: Platform;
	mode?: ChatMode;
	responseMode?: ResponseMode;
	role?: ChatRole;
	[other: string]: any;
}

export interface IFeedbackBody {
	logId: string;
	feedback: 1 | -1 | "1" | "-1" | undefined | null;
	score: number;
}

export interface IUser {
	longitude?: number;
	latitude?: number;
	email: string;
}

export type RagOptions = {
	topK?: number;
	scoreThreshold?: number;
	includeMetadata?: boolean;
	namespace?: string;
	type?: string;
};

export interface IRequest {
	appUrl?: string;
	env: IEnv;
	request?: IBody;
	user?: IUser;
	webhookUrl?: string;
	webhookEvents?: string[];
	mode?: ChatMode;
	useRAG?: boolean;
	ragOptions?: RagOptions;
}

export type IFunctionResponse = {
	status?: string;
	name?: string;
	content?: string | MessageContent[];
	data?: any;
	role?: ChatRole;
	citations?: string[] | null;
	logId?: string;
	mode?: ChatMode;
	id?: string;
	timestamp?: number;
	model?: string;
	platform?: Platform;
};

export interface IFunction {
	name: string;
	appUrl?: string;
	description: string;
	strict?: boolean;
	parameters: {
		type: "object";
		properties: {
			[key: string]: {
				type: string;
				description: string;
				default?: any;
				minimum?: number;
				maximum?: number;
				properties?: {
					[key: string]: {
						type: string;
						description: string;
						enum?: string[];
					};
				};
			};
		};
		required?: string[];
	};
	function: (
		chatId: string,
		params: any,
		req: IRequest,
		appUrl?: string,
	) => Promise<IFunctionResponse>;
}

export interface IWeather {
	cod: number;
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
	};
	weather: {
		main: string;
		description: string;
	}[];
	wind: {
		speed: number;
		deg: number;
	};
	clouds: {
		all: number;
	};
	sys: {
		country: string;
	};
	name: string;
}

// Generic types for embeddings
export type EmbeddingVector = {
	id: string;
	values: number[] | Float32Array;
	metadata: Record<string, any>;
};

export type EmbeddingMatch = {
	id: string;
	score: number;
	metadata: Record<string, any>;
	title?: string;
	content?: string;
};

export type EmbeddingQueryResult = {
	matches: EmbeddingMatch[];
	count: number;
};

export type EmbeddingMutationResult = {
	status: string;
	error: string | null;
};

export interface EmbeddingProvider {
	generate(
		type: string,
		content: string,
		id: string,
		metadata: Record<string, any>,
	): Promise<EmbeddingVector[]>;

	insert(
		embeddings: EmbeddingVector[],
		options: RagOptions,
	): Promise<EmbeddingMutationResult>;

	delete(ids: string[]): Promise<EmbeddingMutationResult>;

	getQuery(query: string): Promise<{ data: any; status: { success: boolean } }>;

	getMatches(
		queryVector: any,
		options: RagOptions,
	): Promise<EmbeddingQueryResult>;

	searchSimilar(
		query: string,
		options?: RagOptions,
	): Promise<
		{
			title: string;
			content: string;
			metadata: Record<string, any>;
			score: number;
			type: string;
		}[]
	>;
}

export interface GuardrailsProvider {
	validateContent(
		content: string,
		source: "INPUT" | "OUTPUT",
	): Promise<GuardrailResult>;
}

export interface GuardrailConfig {
	bedrock: {
		guardrailId: string;
		guardrailVersion: string;
		region: string;
	};
	inputValidation: {
		maxLength: number;
	};
	outputValidation: {
		maxLength: number;
	};
}

export interface GuardrailResult {
	isValid: boolean;
	violations: string[];
	rawResponse?: any;
}

interface AIControlParams {
	// Controls the randomness of the output; higher values produce more random results.
	temperature?: number;
	// Controls the maximum number of tokens in the response.
	max_tokens?: number;
	// Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.
	top_p?: number;
	// Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises.
	top_k?: number;
	// Random seed for reproducibility of the generation.
	seed?: number;
	// Penalty for repeated tokens; higher values discourage repetition.
	repetition_penalty?: number;
	// Controls the frequency of the AI's responses by controlling how many words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.
	frequency_penalty?: number;
	// Controls the relevance of the AI's responses by controlling how many words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.
	presence_penalty?: number;
}

interface AIResponseParamsBase extends AIControlParams {
	chatId?: string;
	appUrl?: string;
	systemPrompt?: string;
	messages: Message[];
	message?: string;
	env: IEnv;
	model?: string;
	version?: string;
	user?: IUser;
	disableFunctions?: boolean;
	webhookUrl?: string;
	webhookEvents?: string[];
	mode?: ChatMode;
}

export type AIResponseParams = RequireAtLeastOne<
	AIResponseParamsBase,
	"model" | "version"
>;

export interface GetAiResponseParams extends AIResponseParamsBase {}

export interface ModelCapabilities {
	card?: string;
	contextWindow: number;
	maxTokens: number;
	costPer1kInputTokens: number;
	costPer1kOutputTokens: number;
	strengths: Array<(typeof availableCapabilities)[number]>;
	contextComplexity: 1 | 2 | 3 | 4 | 5;
	reliability: 1 | 2 | 3 | 4 | 5;
	speed: 1 | 2 | 3 | 4 | 5;
	multimodal?: boolean;
	supportsFunctions?: boolean;
}

export interface PromptRequirements {
	expectedComplexity: 1 | 2 | 3 | 4 | 5;
	requiredCapabilities: ModelCapabilities["strengths"];
	estimatedInputTokens: number;
	estimatedOutputTokens: number;
	hasImages: boolean;
	needsFunctions: boolean;
	budgetConstraint?: number;
}

export interface AIPerformanceMetrics {
	provider: string;
	model: string;
	latency: number;
	tokenUsage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
		prompt_tokens_details?: {
			cached_tokens: number;
			audio_tokens: number;
		};
		completion_tokens_details?: {
			reasoning_tokens: number;
			audio_tokens: number;
			accepted_prediction_tokens: number;
			rejected_prediction_tokens: number;
		};
	};
	systemFingerprint?: string;
	logId?: string;
}

export interface User {
  id: number;
  name: string | null;
  avatar_url: string | null;
  email: string;
  github_username: string | null;
  company: string | null;
  site: string | null;
  location: string | null;
  bio: string | null;
  twitter_username: string | null;
  created_at: string;
  updated_at: string;
  setup_at: string | null;
  terms_accepted_at: string | null;
}