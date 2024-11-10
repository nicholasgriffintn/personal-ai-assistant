import { Hono } from 'hono';

import { IBody } from './types';
import { handleChat } from './services/chat';

const app = new Hono();

app.get('/', (context) => {
	return context.json({
		response: 'Hello, World!',
	});
});

app.post('/chat', async (context) => {
	try {
		const body = (await context.req.json()) as IBody;

		console.log('INCOMING REQUEST');
		console.log(JSON.stringify(body, null, 2));

		if (!context.env.ACCESS_TOKEN) {
			return context.json({
				response: 'Missing ACCESS_TOKEN binding',
				status: 400,
			});
		}

		const auth = context.req.headers.get('Authorization');
		const authToken = auth?.split('Bearer ')[1];

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
