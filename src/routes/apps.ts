import { Hono } from 'hono';

import type { IEnv } from '../types';
import { handlePodcastUpload } from '../services/apps/podcast/upload';
import { handlePodcastTranscribe, type IPodcastTranscribeBody } from '../services/apps/podcast/transcribe';
import { handlePodcastSummarise, IPodcastSummariseBody } from '../services/apps/podcast/summarise';
import { handlePodcastGenerateImage } from '../services/apps/podcast/generate-image';

const app = new Hono();

app.use('/*', async (context, next) => {
	if (!context.env.ACCESS_TOKEN) {
		return context.json({
			response: 'Missing ACCESS_TOKEN binding',
			status: 400,
		});
	}

	const authFromQuery = context.req.query('token');
	const authFromHeaders = context.req.headers.get('Authorization');
	const authToken = authFromQuery || authFromHeaders?.split('Bearer ')[1];

	if (authToken !== context.env.ACCESS_TOKEN) {
		context.status(403);
		return context.json({
			response: 'Unauthorized',
			status: 'error',
		});
	}

	await next();
});

app.post('/podcasts/upload', async (context) => {
	try {
		const userEmail: string = context.req.headers.get('x-user-email') || '';

		const user = {
			email: userEmail,
		};

		const response = await handlePodcastUpload({
			env: context.env as IEnv,
			user,
		});

		return context.json({
			response,
		});
	} catch (error) {
		console.error(error);

		context.status(500);
		return context.json({
			status: 'error',
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/podcasts/transcribe', async (context) => {
	try {
		const body = (await context.req.json()) as IPodcastTranscribeBody;

		const userEmail: string = context.req.headers.get('x-user-email') || '';

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
		console.error(error);

		context.status(500);
		return context.json({
			status: 'error',
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/podcasts/summarise', async (context) => {
	try {
		const body = (await context.req.json()) as IPodcastSummariseBody;

		const userEmail: string = context.req.headers.get('x-user-email') || '';

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
		console.error(error);

		context.status(500);
		return context.json({
			status: 'error',
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/podcasts/generate-image', async (context) => {
	try {
		const body = (await context.req.json()) as IPodcastTranscribeBody;

		const userEmail: string = context.req.headers.get('x-user-email') || '';

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
		console.error(error);

		context.status(500);
		return context.json({
			status: 'error',
			response: 'Something went wrong, we are working on it',
		});
	}
});

export default app;
