import { type Context, Hono, type Next } from "hono";

import { generateImageFromDrawing } from "../services/apps/drawing";
import { guessDrawingFromImage } from "../services/apps/guess-drawing";
import { insertEmbedding } from "../services/apps/insert-embedding";
import { handlePodcastGenerateImage } from "../services/apps/podcast/generate-image";
import {
	type IPodcastSummariseBody,
	handlePodcastSummarise,
} from "../services/apps/podcast/summarise";
import {
	type IPodcastTranscribeBody,
	handlePodcastTranscribe,
} from "../services/apps/podcast/transcribe";
import {
	type UploadRequest,
	handlePodcastUpload,
} from "../services/apps/podcast/upload";
import { queryEmbeddings } from "../services/apps/query-embeddings";
import { getWeatherForLocation } from "../services/apps/weather";
import type { IEnv } from "../types";
import { AppError, handleApiError } from "../utils/errors";

const app = new Hono();

/**
 * Global middleware to check the ACCESS_TOKEN
 */
app.use("/*", async (context: Context, next: Next) => {
	if (!context.env.ACCESS_TOKEN) {
		throw new AppError("Missing ACCESS_TOKEN binding", 400);
	}

	const authFromQuery = context.req.query("token");
	const authFromHeaders = context.req.headers.get("Authorization");
	const authToken = authFromQuery || authFromHeaders?.split("Bearer ")[1];

	if (authToken !== context.env.ACCESS_TOKEN) {
		throw new AppError("Unauthorized", 403);
	}

	await next();
});

/**
 * Insert embedding route
 * @route POST /insert-embedding
 */
app.post("/insert-embedding", async (context: Context) => {
	try {
		const body = await context.req.json();

		const response = await insertEmbedding({
			request: body,
			env: context.env as IEnv,
		});

		if (response.status === "error") {
			throw new AppError("Something went wrong, we are working on it", 500);
		}

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Query embeddings route
 * @route GET /query-embeddings
 */
app.get("/query-embeddings", async (context: Context) => {
	try {
		const query = context.req.query("query");

		const response = await queryEmbeddings({
			env: context.env as IEnv,
			request: { query },
		});

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Weather route
 * @route GET /weather
 */
app.get("/weather", async (context: Context) => {
	try {
		const longitude = context.req.query("longitude")
			? Number.parseFloat(context.req.query("longitude") as string)
			: 0;
		const latitude = context.req.query("latitude")
			? Number.parseFloat(context.req.query("latitude") as string)
			: 0;

		if (!longitude || !latitude) {
			throw new AppError("Missing longitude or latitude", 400);
		}

		const response = await getWeatherForLocation(context.env as IEnv, {
			longitude,
			latitude,
		});
		return context.json({ response });
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Drawing route
 * @route POST /drawing
 */
app.post("/drawing", async (context: Context) => {
	try {
		const body = await context.req.parseBody();

		const userEmail: string = context.req.headers.get("x-user-email") || "";
		const user = {
			email: userEmail,
		};

		const response = await generateImageFromDrawing({
			env: context.env as IEnv,
			request: body,
			user,
		});

		if (response.status === "error") {
			throw new AppError("Something went wrong, we are working on it", 500);
		}

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Guess drawing route
 * @route POST /guess-drawing
 */
app.post("/guess-drawing", async (context: Context) => {
	try {
		const body = await context.req.parseBody();

		const userEmail: string = context.req.headers.get("x-user-email") || "";
		const user = {
			email: userEmail,
		};

		const response = await guessDrawingFromImage({
			env: context.env as IEnv,
			request: body,
			user,
		});

		if (response.status === "error") {
			throw new AppError("Something went wrong, we are working on it", 500);
		}

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Podcast upload route
 * @route POST /podcasts/upload
 */
app.post("/podcasts/upload", async (context: Context) => {
	try {
		const body = (await context.req.json()) as UploadRequest["request"];

		const userEmail: string = context.req.headers.get("x-user-email") || "";

		const user = {
			email: userEmail,
		};

		const response = await handlePodcastUpload({
			env: context.env as IEnv,
			request: body,
			user,
		});

		if (response.status === "error") {
			throw new AppError("Something went wrong, we are working on it", 500);
		}

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Podcast transcribe route
 * @route POST /podcasts/transcribe
 */
app.post("/podcasts/transcribe", async (context: Context) => {
	try {
		const body = (await context.req.json()) as IPodcastTranscribeBody;

		const userEmail: string = context.req.headers.get("x-user-email") || "";

		const user = {
			email: userEmail,
		};

		const newUrl = new URL(context.req.url);
		const appUrl = `${newUrl.protocol}//${newUrl.hostname}`;

		const response = await handlePodcastTranscribe({
			env: context.env as IEnv,
			request: body,
			user,
			appUrl,
		});

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Podcast summarise route
 * @route POST /podcasts/summarise
 */
app.post("/podcasts/summarise", async (context: Context) => {
	try {
		const body = (await context.req.json()) as IPodcastSummariseBody;

		const userEmail: string = context.req.headers.get("x-user-email") || "";

		const user = {
			email: userEmail,
		};

		const response = await handlePodcastSummarise({
			env: context.env as IEnv,
			request: body,
			user,
		});

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Podcast generate image route
 * @route POST /podcasts/generate-image
 */
app.post("/podcasts/generate-image", async (context: Context) => {
	try {
		const body = (await context.req.json()) as IPodcastTranscribeBody;

		const userEmail: string = context.req.headers.get("x-user-email") || "";

		const user = {
			email: userEmail,
		};

		const response = await handlePodcastGenerateImage({
			env: context.env as IEnv,
			request: body,
			user,
		});

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

export default app;
