export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
	{
		[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
	}[Keys];

export type Model =
	| 'claude-3-5-sonnet'
	| 'claude-3.5-haiku'
	| 'claude-3.5-opus'
	| 'llama-3.1-70b-instruct'
	| 'llama-3.2-1b-instruct'
	| 'llama-3.2-3b-instruct'
	| 'hermes-2-pro-mistral-7b'
	| 'grok'
	| 'mistral-nemo'
	| 'smollm2-1.7b-instruct'
	| 'llama-3.1-sonar-small-128k-online'
	| 'llama-3.1-sonar-large-128k-online'
	| 'llama-3.1-sonar-huge-128k-online'
	| 'flux'
	| 'whisper'
	| 'openchat'
	| 'phi-2'
	| 'sqlcoder'
	| 'tinyllama'
	| 'una-cybertron-7b-v2'
	| 'deepseek-coder-6.7b'
	| 'stable-diffusion-1.5-img2img'
	| 'stable-diffusion-1.5-inpainting'
	| 'stable-diffusion-xl-base-1.0'
	| 'stable-diffusion-xl-lightning'
	| 'pixtral-large'
	| 'codestral'
	| 'mistral-large'
	| 'mistral-small'
	| 'mistral-nemo';

export type ModelConfig = {
	[K in Model]: {
		matchingModel: string;
		provider: string;
		type: string;
	};
};

export type Platform = 'web' | 'mobile' | 'api';

export interface IEnv {
	AI: {
		run: (model: string, options: any, config: any) => Promise<any>;
		aiGatewayLogId?: string;
	};
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
}

export type Message = {
	role: string;
	name?: string;
	tool_calls?: Record<string, any>[];
	content: string;
	status?: string;
	data?: Record<string, any>;
	model?: string;
	logId?: string;
	citations?: string[];
	app?: string;
};

export interface IBody {
	chat_id: string;
	input: string;
	date: string;
	location: {
		latitude: number;
		longitude: number;
	};
	model?: Model;
	platform?: Platform;
	[other: string]: any;
}

export interface IFeedbackBody {
	logId: string;
	feedback: string;
}

export interface IUser {
	longitude: number;
	latitude: number;
	email: string;
}

export interface IRequest {
	appUrl?: string;
	env: IEnv;
	request?: IBody;
	user?: IUser;
}

export type IFunctionResponse = {
	status?: string;
	name?: string;
	content: string;
	data?: any;
};

export type IFunction = {
	name: string;
	appUrl?: string;
	description: string;
	parameters: {
		type: 'object';
		properties: {
			[key: string]: {
				type: string;
				description: string;
			};
		};
		required?: string[];
	};
	function: (chatId: string, params: any, req: IRequest, appUrl?: string | undefined) => Promise<IFunctionResponse>;
};

export type IWeather = {
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
};
