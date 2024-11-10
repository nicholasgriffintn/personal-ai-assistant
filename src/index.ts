import { Hono } from 'hono';

import { IBody } from './types';
import { handleChat } from './services/chat';

const app = new Hono();

app.post('/chat', async (context) => {
	try {
		const body = (await context.req.json()) as IBody;

		console.log('INCOMING REQUEST');
		console.log(JSON.stringify(body, null, 2));

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
