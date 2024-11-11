export type Model = 'llama-3.1-70b-instruct' | 'llama-3.2-3b-instruct' | 'hermes-2-pro-mistral-7b';

export interface IBody {
	chat_id: string;
	input: string;
	date: string;
	location: {
		latitude: number;
		longitude: number;
	};
	model?: Model;
}

export interface ICloudflare {
	latitude: number;
	longitude: number;
	continent: string;
	country: string;
	city: string;
	timezone: string;
	colo: string;
	postalCode: string;
	region: string;
}

export interface IUser {
	longitude: number;
	latitude: number;
}

export interface IRequest {
	env: any;
	request?: IBody;
	user?: IUser;
}

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
	function: (params: any, req: IRequest) => Promise<string>;
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
