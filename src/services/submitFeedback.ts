import type { KVNamespaceListResult } from "@cloudflare/workers-types";

import type { IEnv, IFeedbackBody } from "../types";
import { AppError } from "../utils/errors";

export const handleFeedbackSubmission = async (req: {
	request: IFeedbackBody;
	env: IEnv;
}): Promise<KVNamespaceListResult<unknown, string>> => {
	const { request, env } = req;

	if (!request) {
		throw new AppError("Missing request", 400);
	}

	if (!env.AI_GATEWAY_TOKEN || !env.ACCOUNT_ID) {
		throw new AppError("Missing AI_GATEWAY_TOKEN or ACCOUNT_ID binding", 400);
	}

	if (!request.logId || !request.feedback) {
		throw new AppError("Missing logId or feedback", 400);
	}

	const feedbackResponse = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai-gateway/gateways/llm-assistant/logs/${request.logId}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${env.AI_GATEWAY_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				feedback: request.feedback,
			}),
		},
	);

	if (!feedbackResponse.ok) {
		console.error("Failed to submit feedback", feedbackResponse);
		throw new AppError("Failed to submit feedback", 400);
	}

	return await feedbackResponse.json();
};
