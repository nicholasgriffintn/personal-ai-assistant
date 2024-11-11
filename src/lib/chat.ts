import { availableFunctions } from '../services/functions';

export const gatewayId = 'llm-assistant';

export async function getWorkersAIResponse({ model, messages, env }: { model: string; messages: any[]; env: any }) {
	const supportsFunctions = model === '@hf/nousresearch/hermes-2-pro-mistral-7b';

	const modelResponse = await env.AI.run(
		model,
		{
			messages,
			tools: supportsFunctions ? availableFunctions : undefined,
		},
		{
			gateway: {
				id: gatewayId,
				skipCache: false,
				cacheTtl: 3360,
			},
		}
	);

	return modelResponse;
}
