import { Hono } from 'hono';

import type { IEnv, IBody, IFeedbackBody } from '../types';
import { handleCreateChat } from '../services/createChat';
import { handleListChats } from '../services/listChats';
import { handleGetChat } from '../services/getChat';
import { handleCheckChat } from '../services/checkChat';
import { handleFeedbackSubmission } from '../services/submitFeedback';
import { handleTranscribe } from '../services/apps/transcribe';

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
		return context.json({
			response: 'Unauthorized',
			status: 403,
		});
	}

	await next();
});

app.get('/', async (context) => {
	try {
		if (!context.env.CHAT_HISTORY) {
			return context.json({
				response: 'Missing CHAT_HISTORY binding',
				status: 400,
			});
		}

		const response = await handleListChats({
			env: context.env as IEnv,
		});

		return context.json({
			response,
		});
	} catch (error) {
		console.error(error);

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.get('/:id', async (context) => {
	try {
		if (!context.env.CHAT_HISTORY) {
			return context.json({
				response: 'Missing CHAT_HISTORY binding',
				status: 400,
			});
		}

		const id = context.req.param('id');

		const data = await handleGetChat(
			{
				env: context.env as IEnv,
			},
			id
		);

		return context.json(data);
	} catch (error) {
		console.error(error);

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/', async (context) => {
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
		console.error(error);

		return context.json({
			status: 'error',
			content: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/transcribe', async (context) => {
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
		console.error(error);

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/check', async (context) => {
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
		console.error(error);

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/feedback', async (context) => {
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
		console.error(error);

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

export default app;
