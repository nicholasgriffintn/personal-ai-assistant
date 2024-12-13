import type { KVNamespaceListResult } from "@cloudflare/workers-types";

import type { IEnv, IFeedbackBody } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";

export const handleFeedbackSubmission = async (req: {
	request: IFeedbackBody;
	env: IEnv;
}): Promise<KVNamespaceListResult<unknown, string>> => {
	const { request, env } = req;

	if (!request) {
		throw new AssistantError("Missing request", ErrorType.PARAMS_ERROR);
	}

	if (!env.AI_GATEWAY_TOKEN || !env.ACCOUNT_ID) {
		throw new AssistantError(
			"Missing AI_GATEWAY_TOKEN or ACCOUNT_ID binding",
			ErrorType.PARAMS_ERROR,
		);
	}

	if (!request.logId || !request.feedback) {
		throw new AssistantError(
			"Missing logId or feedback",
			ErrorType.PARAMS_ERROR,
		);
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
		throw new AssistantError("Failed to submit feedback");
	}

	return await feedbackResponse.json();
};
