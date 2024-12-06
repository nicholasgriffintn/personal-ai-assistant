import type { AIResponseParams } from '../lib/chat';
import { fetchAIResponse } from './fetch';

export interface AIProvider {
	name: string;
	getResponse(params: AIResponseParams): Promise<any>;
}

export async function getAIResponseFromProvider(provider: string, url: string, headers: Record<string, string>, body: Record<string, any>) {
	const data: any = await fetchAIResponse(provider, url, headers, body);
	
	let response: string;
	if (provider === 'google-ai-studio') {
		response = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
	} else {
		response = data.choices?.map((choice: { message: { content: string } }) => choice.message.content).join(' ');
	}
	
	return { ...data, response };
}
