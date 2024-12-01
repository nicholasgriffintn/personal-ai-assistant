import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';

import apps from './routes/apps';
import webhooks from './routes/webhooks';
import chat from './routes/chat';
import { homeTemplate } from './templates/home';
import { ROUTES } from './contstants/routes';

const app = new Hono();

/**
 * Global middleware to enable CORS
 */
app.use(
	'*',
	cors({
		origin: ['http://localhost:3000', 'https://nicholasgriffin.dev'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
	})
);

/**
 * Home route that displays a welcome message
 * @route GET /
 */
app.get('/', (context: Context) => {
	return context.html(homeTemplate);
});

app.get('/status', (c) => c.json({ status: 'ok' }));

/**
 * Webhooks route
 */
app.route(ROUTES.WEBHOOKS, webhooks);

/**
 * Chat route
 */
app.route(ROUTES.CHAT, chat);

/**
 * Apps route
 */
app.route(ROUTES.APPS, apps);

/**
 * Global middleware to log the request method and URL
 */
app.use('*', async (c, next) => {
	const start = Date.now();
	await next();
	const end = Date.now();
	console.log(`${c.req.method} ${c.req.url} - ${end - start}ms`);
});

/**
 * Global error handler
 */
app.onError((err, c) => {
	console.error(`${err}`);
	return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
