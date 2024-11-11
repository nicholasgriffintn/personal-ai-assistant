import { Hono } from 'hono';

import type { IBody, IFeedbackBody } from './types';
import { handleCreateChat } from './services/createChat';
import { handleListChats } from './services/listChats';
import { handleGetChat } from './services/getChat';
import { handleFeedbackSubmission } from './services/submitFeedback';

const app = new Hono();

app.get('/', (context) => {
	return context.html(`
		<html>
			<head>
				<title>Nicholas Griffin's Personal Assistant</title>
			</head>
			<body>Hello! Sorry, not much to see here yet.</body>
		</html>
	`);
});

app.use('/chat/*', async (context, next) => {
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

app.get('/chat', async (context) => {
	try {
		if (!context.env.CHAT_HISTORY) {
			return context.json({
				response: 'Missing CHAT_HISTORY binding',
				status: 400,
			});
		}

		const response = await handleListChats({
			env: context.env,
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

app.get('/chat/:id', async (context) => {
	try {
		if (!context.env.CHAT_HISTORY) {
			return context.json({
				response: 'Missing CHAT_HISTORY binding',
				status: 400,
			});
		}

		const id = context.req.param('id');

		const response = await handleGetChat(
			{
				env: context.env,
			},
			id
		);

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

app.post('/chat', async (context) => {
	try {
		const body = (await context.req.json()) as IBody;

		const user = {
			// @ts-ignore
			longitude: context.req.cf?.longitude,
			// @ts-ignore
			latitude: context.req.cf?.latitude,
		};

		const data = await handleCreateChat({
			env: context.env,
			request: body,
			user,
		});

		if (Array.isArray(data)) {
			return context.json({
				response: data.map((item) => item.response).join('\n'),
				data,
			});
		}

		return context.json(data);
	} catch (error) {
		console.error(error);

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/chat/feedback', async (context) => {
	try {
		const body = (await context.req.json()) as IFeedbackBody;

		const response = await handleFeedbackSubmission({
			env: context.env,
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
