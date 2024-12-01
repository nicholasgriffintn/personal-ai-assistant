import { Hono, Context, Next } from 'hono';

import type { IEnv, IBody, IFeedbackBody } from '../types';
import { handleCreateChat } from '../services/createChat';
import { handleListChats } from '../services/listChats';
import { handleGetChat } from '../services/getChat';
import { handleCheckChat } from '../services/checkChat';
import { handleFeedbackSubmission } from '../services/submitFeedback';
import { handleTranscribe } from '../services/apps/transcribe';
import { handleApiError, AppError } from '../utils/errors';

const app = new Hono();

/**
 * Global middleware to check the ACCESS_TOKEN
 */
app.use('/*', async (context: Context, next: Next) => {
	if (!context.env.ACCESS_TOKEN) {
		throw new AppError('Missing ACCESS_TOKEN binding', 400);
	}

	const authFromQuery = context.req.query('token');
	const authFromHeaders = context.req.headers.get('Authorization');
	const authToken = authFromQuery || authFromHeaders?.split('Bearer ')[1];

	if (authToken !== context.env.ACCESS_TOKEN) {
		throw new AppError('Unauthorized', 403);
	}

	await next();
});

/**
 * List chats route
 * @route GET /
 */
app.get('/', async (context: Context) => {
	try {
		if (!context.env.CHAT_HISTORY) {
			throw new AppError('Missing CHAT_HISTORY binding', 400);
		}

		const response = await handleListChats({
			env: context.env as IEnv,
		});

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Get chat route
 * @route GET /:id
 */
app.get('/:id', async (context: Context) => {
	try {
		if (!context.env.CHAT_HISTORY) {
			throw new AppError('Missing CHAT_HISTORY binding', 400);
		}

		const id = context.req.param('id');

		if (!id) {
			throw new AppError('Missing ID', 400);
		}

		const data = await handleGetChat(
			{
				env: context.env as IEnv,
			},
			id
		);

		return context.json(data);
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Create chat route
 * @route POST /
 */
app.post('/', async (context: Context) => {
	try {
		const body = (await context.req.json()) as IBody;

		const userEmail: string = context.req.headers.get('x-user-email') || '';

		const user = {
			// @ts-ignore
			longitude: context.req.cf?.longitude,
			// @ts-ignore
			latitude: context.req.cf?.latitude,
			email: userEmail,
		};

		const newUrl = new URL(context.req.url);
		const appUrl = `${newUrl.protocol}//${newUrl.hostname}`;

		const data = await handleCreateChat({
			appUrl,
			env: context.env as IEnv,
			request: body,
			user,
		});

		return context.json(data);
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Transcribe route
 * @route POST /transcribe
 */
app.post('/transcribe', async (context: Context) => {
	try {
		const body = await context.req.parseBody();

		const userEmail: string = context.req.headers.get('x-user-email') || '';

		const user = {
			email: userEmail,
		};

		const response = await handleTranscribe({
			env: context.env as IEnv,
			audio: body['audio'] as Blob,
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
 * Check chat route
 * @route POST /check
 */
app.post('/check', async (context: Context) => {
	try {
		const body = (await context.req.json()) as IBody;

		const response = await handleCheckChat({
			env: context.env as IEnv,
			request: body,
		});

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

/**
 * Feedback route
 * @route POST /feedback
 */
app.post('/feedback', async (context: Context) => {
	try {
		const body = (await context.req.json()) as IFeedbackBody;

		const response = await handleFeedbackSubmission({
			env: context.env as IEnv,
			request: body,
		});

		return context.json({
			response,
		});
	} catch (error) {
		return handleApiError(error);
	}
});

export default app;
