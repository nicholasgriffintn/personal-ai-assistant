import type { IFeedbackBody } from '../types';

export const handleFeedbackSubmission = async (req: {
	request: IFeedbackBody;
	env: any;
}): Promise<KVNamespaceListResult<unknown, string>> => {
	const { request, env } = req;

	if (!request) {
		throw new Error('Missing request');
	}

	if (!env.AI_GATEWAY_TOKEN || !env.ACCOUNT_ID) {
		throw new Error('Missing AI_GATEWAY_TOKEN or ACCOUNT_ID binding');
	}

	if (!request.logId || !request.feedback) {
		throw new Error('Missing logId or feedback');
	}

	const feedbackResponse = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai-gateway/gateways/llm-assistant/logs/${request.logId}`,
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${env.AI_GATEWAY_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				feedback: request.feedback,
			}),
		}
	);

	if (!feedbackResponse.ok) {
		throw new Error('Failed to submit feedback');
	}

	return await feedbackResponse.json();
};
