import { Hono } from 'hono';

import apps from './routes/apps';
import webhooks from './routes/webhooks';
import chat from './routes/chat';

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

app.route('/webhooks', webhooks);

app.route('/chat', chat);

app.route('/apps', apps);

export default app;
