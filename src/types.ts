export interface IBody {
	chat_id: string;
	input: string;
	date: string;
	location: {
		latitude: number;
		longitude: number;
	};
}

export interface IRequest {
	env: any;
	request: IBody;
}
