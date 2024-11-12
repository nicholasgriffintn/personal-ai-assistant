export type Model =
	| 'claude-3-5-sonnet'
	| 'claude-3.5-haiku'
	| 'claude-3.5-opus'
	| 'llama-3.1-70b-instruct'
	| 'llama-3.2-3b-instruct'
	| 'hermes-2-pro-mistral-7b'
	| 'grok'
	| 'mistral-nemo'
	| 'smollm2-1.7b-instruct'
	| 'llama-3.1-sonar-small-128k-online'
	| 'llama-3.1-sonar-large-128k-online'
	| 'llama-3.1-sonar-huge-128k-online';
export type Platform = 'web' | 'mobile' | 'api';

export interface IEnv {
	AI: {
		run: (model: string, options: any, config: any) => Promise<any>;
		aiGatewayLogId?: string;
	};
	ACCOUNT_ID: string;
	ANTHROPIC_API_KEY?: string;
	AI_GATEWAY_TOKEN?: string;
	GROK_API_KEY?: string;
	HUGGINGFACE_TOKEN?: string;
	PERPLEXITY_API_KEY?: string;
	CHAT_HISTORY?: any;
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
}

export interface IFeedbackBody {
	logId: string;
	feedback: string;
}

export interface IUser {
	longitude: number;
	latitude: number;
}

export interface IRequest {
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
	description: string;
	parameters: {
		type: 'object';
		properties: {
			[key: string]: {
				type: string;
				description: string;
			};
		};
	};
	function: (params: any, req: IRequest) => Promise<IFunctionResponse>;
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
