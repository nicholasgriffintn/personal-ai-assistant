import type { IEnv, IFeedbackBody } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { gatewayId } from "../constants/app";

export const handleFeedbackSubmission = async (req: {
	request: IFeedbackBody;
	env: IEnv;
	user: {
		email: string;
	};
}): Promise<{ success: boolean }> => {
	const { request, env, user } = req;

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

	const gateway = env.AI.gateway(gatewayId);

	// TODO: Add score and metadata
	await gateway.patchLog(request.logId, {
		feedback: request.feedback,
		score: request.score,
		metadata: {
			user: user.email,
		},
	});

	return {
		success: true,
	};
};
