import type { AIResponseParams } from '../lib/chat';
import { fetchAIResponse } from './fetch';

export interface AIProvider {
	name: string;
	getResponse(params: AIResponseParams): Promise<any>;
}

export async function getAIResponseFromProvider(provider: string, url: string, headers: Record<string, string>, body: Record<string, any>) {
	const data: any = await fetchAIResponse(provider, url, headers, body);
	const response = data.choices?.map((choice: { message: { content: string } }) => choice.message.content).join(' ');
	return { ...data, response };
}
