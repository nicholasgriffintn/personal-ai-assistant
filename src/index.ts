import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import apps from './routes/apps';
import webhooks from './routes/webhooks';
import chat from './routes/chat';
import { homeTemplate } from './templates/home';
import { ROUTES } from './contstants/routes';
import { handleApiError, AppError } from './utils/errors';

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
 * Global middleware to log the request method and URL
 */
app.use('*', logger());

/**
 * Global middleware to rate limit requests
 */
app.use('*', async (context: Context, next: Next) => {
	if (!context.env.RATE_LIMITER) {
		throw new AppError('Missing RATE_LIMITER binding', 500);
	}

	const url = context.req.url;
	const pathname = new URL(url).pathname;

	const userEmail: string = context.req.headers.get('x-user-email') || 'anonymous';

	const key = `${userEmail}-${pathname}`;

	const result = await context.env.RATE_LIMITER.limit({ key });

	if (!result.success) {
		throw new AppError('Rate limit exceeded', 429);
	}

	return next();
});

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
 * Global error handler
 */
app.onError((err, c) => {
	return handleApiError(err);
});

export default app;
