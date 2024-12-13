import { type Context, Hono, type Next } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";

import type { IEnv } from "../types";
import { AssistantError, ErrorType } from '../utils/errors';
import { generateImageFromDrawing } from '../services/apps/drawing';
import { guessDrawingFromImage } from '../services/apps/guess-drawing';
import { type IInsertEmbeddingRequest, insertEmbedding } from '../services/apps/insert-embedding';
import { handlePodcastGenerateImage } from '../services/apps/podcast/generate-image';
import { type IPodcastSummariseBody, handlePodcastSummarise } from '../services/apps/podcast/summarise';
import { type IPodcastTranscribeBody, handlePodcastTranscribe } from '../services/apps/podcast/transcribe';
import { type UploadRequest, handlePodcastUpload } from '../services/apps/podcast/upload';
import { queryEmbeddings } from '../services/apps/query-embeddings';
import { getWeatherForLocation } from '../services/apps/weather';
import { generateImage, type ImageGenerationParams } from '../services/apps/generate-image';
import { generateVideo, type VideoGenerationParams } from '../services/apps/generate-video';
import { generateMusic, type MusicGenerationParams } from '../services/apps/generate-music';
import {
	insertEmbeddingSchema,
	queryEmbeddingsSchema,
	weatherQuerySchema,
	imageGenerationSchema,
	videoGenerationSchema,
	musicGenerationSchema,
	drawingSchema,
	guessDrawingSchema,
	podcastUploadSchema,
	podcastTranscribeSchema,
	podcastSummarizeSchema,
	podcastGenerateImageSchema,
	articleAnalyzeSchema,
	articleSummariseSchema,
	generateArticlesReportSchema,
} from './schemas/apps';
import { userHeaderSchema } from './schemas/shared';
import { analyseArticle, Params as AnalyseArticleParams } from '../services/apps/articles/analyse';
import { summariseArticle, Params as SummariseArticleParams } from '../services/apps/articles/summarise';
import { generateArticlesReport, Params as GenerateArticlesReportParams } from '../services/apps/articles/generate-report';

const app = new Hono();

/**
 * Global middleware to check the ACCESS_TOKEN
 */
app.use('/*', async (context: Context, next: Next) => {
	if (!context.env.ACCESS_TOKEN) {
		throw new AssistantError('Access token not configured', ErrorType.CONFIGURATION_ERROR);
	}

	const authFromQuery = context.req.query('token');
	const authFromHeaders = context.req.header('Authorization');
	const authToken = authFromQuery || authFromHeaders?.split('Bearer ')[1];

	if (authToken !== context.env.ACCESS_TOKEN) {
		throw new AssistantError('Unauthorized', ErrorType.AUTHENTICATION_ERROR);
	}

	await next();
});

app.post(
	'/insert-embedding',
	describeRoute({
		tags: ['apps'],
		description: 'Insert an embedding into the database',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', insertEmbeddingSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as IInsertEmbeddingRequest['request'];

		const response = await insertEmbedding({
			request: body,
			env: context.env as IEnv,
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.get(
	'/query-embeddings',
	describeRoute({
		tags: ['apps'],
		description: 'Query embeddings from the database',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('query', queryEmbeddingsSchema),
	async (context: Context) => {
		const query = context.req.valid('query' as never);

		const response = await queryEmbeddings({
			env: context.env as IEnv,
			request: { query },
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.get(
	'/weather',
	describeRoute({
		tags: ['apps'],
		description: 'Get the weather for a location',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('query', weatherQuerySchema),
	async (context: Context) => {
		const query = context.req.valid('query' as never) as {
			longitude: string;
			latitude: string;
		};

		const longitude = query.longitude ? Number.parseFloat(query.longitude) : 0;
		const latitude = query.latitude ? Number.parseFloat(query.latitude) : 0;

		if (!longitude || !latitude) {
			throw new AssistantError('Invalid longitude or latitude', ErrorType.PARAMS_ERROR);
		}

		const response = await getWeatherForLocation(context.env as IEnv, {
			longitude,
			latitude,
		});
		return context.json({ response });
	}
);

app.post(
	'/generate-image',
	describeRoute({
		tags: ['apps'],
		description: 'Generate an image',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', imageGenerationSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as ImageGenerationParams;

		const chatId = Math.random().toString(36).substring(2, 15);

		const response = await generateImage({
			chatId,
			env: context.env as IEnv,
			args: body,
			appUrl: context.req.url,
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.post(
	'/generate-video',
	describeRoute({
		tags: ['apps'],
		description: 'Generate a video',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', videoGenerationSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as VideoGenerationParams;

		const chatId = Math.random().toString(36).substring(2, 15);

		const response = await generateVideo({
			chatId,
			env: context.env as IEnv,
			args: body,
			appUrl: context.req.url,
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.post(
	'/generate-music',
	describeRoute({
		tags: ['apps'],
		description: 'Generate music',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', musicGenerationSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as MusicGenerationParams;

		const chatId = Math.random().toString(36).substring(2, 15);

		const response = await generateMusic({
			chatId,
			env: context.env as IEnv,
			args: body,
			appUrl: context.req.url,
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.post(
	'/drawing',
	describeRoute({
		tags: ['apps'],
		description: 'Generate an image from a drawing',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('form', drawingSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('form' as never);

		const headers = context.req.valid('header' as never);
		const user = {
			email: headers['x-user-email'],
		};

		const response = await generateImageFromDrawing({
			env: context.env as IEnv,
			request: body,
			user,
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.post(
	'/guess-drawing',
	describeRoute({
		tags: ['apps'],
		description: 'Guess a drawing from an image',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('form', guessDrawingSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('form' as never);

		const headers = context.req.valid('header' as never);
		const user = {
			email: headers['x-user-email'],
		};

		const response = await guessDrawingFromImage({
			env: context.env as IEnv,
			request: body,
			user,
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.post(
	'/podcasts/upload',
	describeRoute({
		tags: ['apps', 'podcasts'],
		description: 'Upload a podcast',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', podcastUploadSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as UploadRequest['request'];

		const headers = context.req.valid('header' as never);
		const user = {
			email: headers['x-user-email'],
		};

		const response = await handlePodcastUpload({
			env: context.env as IEnv,
			request: body,
			user,
		});

		if (response.status === 'error') {
			throw new AssistantError('Something went wrong, we are working on it', ErrorType.UNKNOWN_ERROR);
		}

		return context.json({
			response,
		});
	}
);

app.post(
	'/podcasts/transcribe',
	describeRoute({
		tags: ['apps', 'podcasts'],
		description: 'Transcribe a podcast',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', podcastTranscribeSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as IPodcastTranscribeBody;

		const headers = context.req.valid('header' as never);
		const user = {
			email: headers['x-user-email'],
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
	}
);

app.post(
	'/podcasts/summarise',
	describeRoute({
		tags: ['apps', 'podcasts'],
		description: 'Summarise a podcast',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', podcastSummarizeSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as IPodcastSummariseBody;

		const headers = context.req.valid('header' as never);
		const user = {
			email: headers['x-user-email'],
		};

		const response = await handlePodcastSummarise({
			env: context.env as IEnv,
			request: body,
			user,
		});

		return context.json({
			response,
		});
	}
);

app.post(
	'/podcasts/generate-image',
	describeRoute({
		tags: ['apps', 'podcasts'],
		description: 'Generate an image for a podcast',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', podcastGenerateImageSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as IPodcastTranscribeBody;

		const headers = context.req.valid('header' as never);
		const user = {
			email: headers['x-user-email'],
		};

		const response = await handlePodcastGenerateImage({
			env: context.env as IEnv,
			request: body,
			user,
		});

		return context.json({
			response,
		});
	}
);

app.post(
	'/articles/analyse',
	describeRoute({
		tags: ['apps', 'articles'],
		description: 'Analyse an article',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', articleAnalyzeSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as AnalyseArticleParams;

		const headers = context.req.valid('header' as never);

		const chatId = Math.random().toString(36).substring(2, 15);

		const response = await analyseArticle({
			chatId,
			env: context.env as IEnv,
			args: body,
			appUrl: context.req.url,
		});

		return context.json({
			response,
		});
	}
);

app.post(
	'/articles/summarise',
	describeRoute({
		tags: ['apps', 'articles'],
		description: 'Summarise an article',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', articleSummariseSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as SummariseArticleParams;

		const headers = context.req.valid('header' as never);

		const chatId = Math.random().toString(36).substring(2, 15);

		const response = await summariseArticle({
			chatId,
			env: context.env as IEnv,
			args: body,
			appUrl: context.req.url,
		});

		return context.json({
			response,
		});
	}
);

app.post(
	'/articles/generate-report',
	describeRoute({
		tags: ['apps', 'articles'],
		description: 'Generate a report about a set of articles',
		responses: {
			200: {
				description: 'Response',
				content: {
					'application/json': {
						schema: resolver(z.object({})),
					},
				},
			},
		},
	}),
	zValidator('json', generateArticlesReportSchema),
	zValidator('header', userHeaderSchema),
	async (context: Context) => {
		const body = context.req.valid('json' as never) as GenerateArticlesReportParams;

		const headers = context.req.valid('header' as never);

		const chatId = Math.random().toString(36).substring(2, 15);

		const response = await generateArticlesReport({
			chatId,
			env: context.env as IEnv,
			args: body,
			appUrl: context.req.url,
		});

		return context.json({
			response,
		});
	}
);

export default app;
