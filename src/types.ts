type Model = 'llama-3.1';

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
