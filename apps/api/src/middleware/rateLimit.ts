import { Context, Next } from "hono";

import { AssistantError, ErrorType } from "../utils/errors";
import { trackUsageMetric } from "../lib/monitoring";

export async function rateLimit(context: Context, next: Next) {
	if (!context.env.RATE_LIMITER) {
		throw new AssistantError(
			"Rate limiter not configured",
			ErrorType.CONFIGURATION_ERROR,
		);
	}

	const url = context.req.url;
	const pathname = new URL(url).pathname;

	const user = context.get("user");
	const userEmail: string = user?.email || "anonymous@undefined.computer";

	const authFromQuery = context.req.query("token");
	const authFromHeaders = context.req.header("Authorization");
	const authToken = authFromQuery || authFromHeaders?.split("Bearer ")[1];
	const isAuthenticated = authToken === context.env.ACCESS_TOKEN;

	const key = isAuthenticated 
		? `authenticated-${userEmail}-${pathname}`
		: `unauthenticated-${userEmail}-${pathname}`;

	const result = await context.env.RATE_LIMITER.limit({ 
		key,
	});

	if (!result.success) {
		throw new AssistantError(
			isAuthenticated 
				? "Rate limit exceeded: 100 requests per minute" 
				: "Rate limit exceeded: 20 requests per 2 minutes. Please authenticate for higher limits.",
			ErrorType.RATE_LIMIT_ERROR
		);
	}

	trackUsageMetric(userEmail, context.env.ANALYTICS);

	return next();
}