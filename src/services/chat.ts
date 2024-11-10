import { IRequest } from '../types';

export const handleChat = async (req: IRequest): Promise<string> => {
	const { request } = req;

	return `Hello, you said: ${request.input}`;
};
