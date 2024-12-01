export class AppError extends Error {
	constructor(public message: string, public statusCode: number = 500, public code?: string) {
		super(message);
	}
}

export function handleApiError(error: unknown) {
	console.error(error);
	if (error instanceof AppError) {
		return Response.json({ error: error.message, code: error.code }, { status: error.statusCode });
	}
	return Response.json({ error: 'Internal Server Error' }, { status: 500 });
}
