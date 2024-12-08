import { AppError } from '../../utils/errors';
import { Embedding } from '../../lib/embedding';

export const insertEmbedding = async (req: any): Promise<any> => {
	try {
		const { request, env } = req;

		const { type, content, id, metadata } = request;

		if (!type) {
			throw new AppError('Missing type from request', 400);
		}
		if (!content) {
			throw new AppError('Missing content from request', 400);
		}

		const embedding = Embedding.getInstance(env);

		const generated = await embedding.generate(content, id, metadata);
		const inserted = await embedding.insert(generated);

		return {
			status: 'success',
			data: {
				vector: inserted,
				embedding: generated,
			},
		};
	} catch (error) {
		console.error(error);
		throw new AppError('Error inserting embedding', 400);
	}
};
