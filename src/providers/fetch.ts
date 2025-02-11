import { availableFunctions } from "../services/functions";
import type { IEnv } from "../types";
import { AssistantError, ErrorType } from "../utils/errors";
import { gatewayId } from "../constants/app";

export async function fetchAIResponse(
	provider: string,
	endpointOrUrl: string,
	headers: Record<string, string>,
	body: Record<string, any>,
	env?: IEnv,
) {
	const isUrl = endpointOrUrl.startsWith("http");

	const tools = provider === "tool-use" ? availableFunctions : undefined;
	const bodyWithTools = tools ? { ...body, tools } : body;

	let response;
	if (!isUrl) {
		if (!env?.AI) {
			throw new AssistantError("AI binding is required to fetch gateway responses", ErrorType.PARAMS_ERROR);
		}

		const gateway = env.AI.gateway(gatewayId);

		// TODO: Add configurable request timeout by provider, at the moment, it's hardcoded to something really high
		// TODO: Potentially add fallback options for gateway (add a second model to call if the first one fails)

		// @ts-expect-error - types seem to be wrong
		response = await gateway.run({
			provider: provider,
			endpoint: endpointOrUrl,
			headers: headers,
			query: bodyWithTools,
			config: {
				requestTimeout: 100000,
				maxAttempts: 2,
				retryDelay: 500,
				backoff: "exponential",
			},
		});
	} else {
		response = await fetch(endpointOrUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(bodyWithTools),
		});
	}

	if (!response.ok) {
		console.error(await response.text());
		throw new AssistantError(
			`Failed to get response for ${provider} from ${endpointOrUrl}`,
		);
	}

	const data = (await response.json()) as Record<string, any>;

	const eventId = response.headers.get("cf-aig-event-id");
	const logId = response.headers.get("cf-aig-log-id");
	const cacheStatus = response.headers.get("cf-aig-cache-status");

	return { ...data, eventId, logId, cacheStatus };
}
