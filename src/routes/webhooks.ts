import { Hono } from 'hono';

import type { IEnv, IBody } from '../types';
import { handleReplicateWebhook } from '../services/webhooks/replicate';

const app = new Hono();

app.use('/*', async (context, next) => {
	if (!context.env.WEBHOOK_SECRET) {
		return context.json({
			response: 'Missing WEBHOOK_SECRET binding',
			status: 400,
		});
	}

	const tokenFromQuery = context.req.query('token');

	if (tokenFromQuery !== context.env.WEBHOOK_SECRET) {
		return context.json({
			response: 'Unauthorized',
			status: 403,
		});
	}

	await next();
});

app.post('/replicate', async (context) => {
	try {
		const body = (await context.req.json()) as IBody;

		const id = context.req.query('chatId');

		const data = await handleReplicateWebhook(
			{
				env: context.env as IEnv,
				request: body,
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

export default app;
