import { Hono } from 'hono';

import type { IBody, IEnv, IFeedbackBody } from './types';
import { handleCreateChat } from './services/createChat';
import { handleListChats } from './services/listChats';
import { handleGetChat } from './services/getChat';
import { handleCheckChat } from './services/checkChat';
import { handleFeedbackSubmission } from './services/submitFeedback';
import { handleReplicateWebhook } from './services/webhooks/replicate';
import { handleTranscribe } from './services/apps/transcribe';
import { handlePodcastUpload } from './services/apps/podcast/upload';
import { handlePodcastTranscribe, type IPodcastTranscribeBody } from './services/apps/podcast/transcribe';
import { handlePodcastSummarise, IPodcastSummariseBody } from './services/apps/podcast/summarise';
import { handlePodcastGenerateImage } from './services/apps/podcast/generate-image';

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

app.use('/webhooks/*', async (context, next) => {
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

app.post('/webhooks/replicate', async (context) => {
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

app.get('/chat/:id', async (context) => {
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

app.post('/chat', async (context) => {
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

app.post('/chat/transcribe', async (context) => {
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

app.post('/chat/check', async (context) => {
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

app.post('/chat/feedback', async (context) => {
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

app.post('/apps/podcasts/upload', async (context) => {
	try {
		const body = await context.req.parseBody();

		const userEmail: string = context.req.headers.get('x-user-email') || '';

		const user = {
			email: userEmail,
		};

		const response = await handlePodcastUpload({
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

app.post('/apps/podcasts/transcribe', async (context) => {
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

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/apps/podcasts/summarise', async (context) => {
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

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

app.post('/apps/podcasts/generate-image', async (context) => {
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

		return context.json({
			response: 'Something went wrong, we are working on it',
		});
	}
});

export default app;
