import { Hono } from 'hono';

import type { IBody } from './types';
import { handleChat } from './services/chat';

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

app.post('/chat', async (context) => {
	try {
		const body = (await context.req.json()) as IBody;

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

		const response = await handleChat({
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
