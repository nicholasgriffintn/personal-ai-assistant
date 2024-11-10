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

export interface IRequest {
	env: any;
	request: IBody;
}
