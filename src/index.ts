import { Hono, type Context, type Next } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { openAPISpecs } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

import { ROUTES } from "./contstants/routes";
import apps from "./routes/apps";
import chat from "./routes/chat";
import webhooks from "./routes/webhooks";
import {
	AssistantError,
	ErrorType,
	handleAIServiceError,
} from "./utils/errors";
import { metricsResponseSchema, statusResponseSchema } from "./routes/schemas";

const app = new Hono();

/**
 * Global middleware to enable CORS
 */
app.use(
	"*",
	cors({
		origin: ["http://localhost:3000", "https://nicholasgriffin.dev"],
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
	}),
);

/**
 * Global middleware to log the request method and URL
 */
app.use("*", logger());

/**
 * Global middleware to rate limit requests
 */
app.use("*", async (context: Context, next: Next) => {
	if (!context.env.RATE_LIMITER) {
		throw new AssistantError(
			"Rate limiter not configured",
			ErrorType.CONFIGURATION_ERROR,
		);
	}

	const url = context.req.url;
	const pathname = new URL(url).pathname;

	const userEmail: string = context.req.header("x-user-email") || "anonymous";

	const key = `${userEmail}-${pathname}`;

	const result = await context.env.RATE_LIMITER.limit({ key });

	if (!result.success) {
		throw new AssistantError("Rate limit exceeded", ErrorType.RATE_LIMIT_ERROR);
	}

	return next();
});

app.get("/", swaggerUI({ url: "/openapi" }));

app.get(
	"/openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Assistant",
				version: "0.0.1",
				description:
					"A group of AI tools by Nicholas Griffin, for Nicholas Griffin",
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
			security: [
				{
					bearerAuth: [],
				},
			],
			servers: [
				{
					url: "http://localhost:8787",
					description: "development",
				},
				{
					url: "https://assistant.nicholasgriffin.workers.dev",
					description: "production",
				},
			],
		},
	}),
);

app.get(
	"/status",
	describeRoute({
		description: "Check if the API is running",
		responses: {
			200: {
				description: "API is running",
				content: {
					"application/json": {
						schema: resolver(statusResponseSchema),
					},
				},
			},
		},
	}),
	(c) => c.json({ status: "ok" }),
);

app.get(
	"/metrics",
	describeRoute({
		description: "Get metrics from Analytics Engine",
		responses: {
			200: {
				description: "Metrics retrieved successfully",
				content: {
					"application/json": {
						schema: resolver(metricsResponseSchema),
					},
				},
			},
		},
	}),
	async (context: Context) => {
		if (!context.env.ANALYTICS || !context.env.ACCOUNT_ID) {
			throw new AssistantError(
				"Analytics Engine or Account ID not configured",
				ErrorType.CONFIGURATION_ERROR,
			);
		}

		const query = `
    SELECT 
        blob1 as type,
        blob2 as name,
        blob3 as status,
        blob4 as error,
        blob5 as traceId,
        double1 as value,
        timestamp,
        toStartOfInterval(timestamp, INTERVAL '1' MINUTE) as truncated_time,
        extract(MINUTE from now()) - extract(MINUTE from timestamp) as minutesAgo,
        SUM(_sample_interval) as sampleCount
    FROM assistant_analytics
    WHERE timestamp > now() - INTERVAL '24' HOUR
    GROUP BY 
        blob1, blob2, blob3, blob4, blob5, 
        double1, timestamp
    ORDER BY timestamp DESC
    LIMIT 100
		`;
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${context.env.ACCOUNT_ID}/analytics_engine/sql?query=${encodeURIComponent(query)}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${context.env.ANALYTICS_API_KEY}`,
				},
			},
		);

		if (!response.ok) {
			console.error("Error querying Analytics Engine:", await response.text());
			throw new AssistantError("Failed to fetch metrics from Analytics Engine");
		}

		const metricsResponse = (await response.json()) as {
			meta: {
				name: string;
				type: string;
			}[];
			data: {
				[key: string]: string | number | boolean;
			}[];
		};

		if (!metricsResponse.data) {
			throw new AssistantError("No metrics found in Analytics Engine");
		}

		return context.json({ metrics: metricsResponse.data });
	},
);

/**
 * Webhooks route
 */
app.route(ROUTES.WEBHOOKS, webhooks);

/**
 * Chat route
 */
app.route(ROUTES.CHAT, chat);

/**
 * Apps route
 */
app.route(ROUTES.APPS, apps);

/**
 * Global 404 handler
 */
app.notFound((c) => c.json({ status: "not found" }, 404));

/**
 * Global error handler
 */
app.onError((err, c) => {
	if (err instanceof AssistantError) {
		return handleAIServiceError(err);
	}

	const error = AssistantError.fromError(err, ErrorType.UNKNOWN_ERROR);
	return handleAIServiceError(error);
});

export default app;
