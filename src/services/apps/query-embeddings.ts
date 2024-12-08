import { AppError } from '../../utils/errors';
import { Embedding } from '../../lib/embedding';

export const queryEmbeddings = async (req: any): Promise<any> => {
	try {
		const { request, env } = req;

		const { query } = request;

		if (!query) {
			throw new AppError('Missing query from request', 400);
		}

		const embedding = Embedding.getInstance(env);

		const queryEmbedding = await embedding.getQuery(query);

		if (!queryEmbedding.data) {
			throw new AppError('No embedding data found', 400);
		}

		const matches = await embedding.getMatches(queryEmbedding.data[0]);

		return {
			status: 'success',
			data: matches,
		};
	} catch (error) {
		console.error(error);
		throw new AppError('Error querying embeddings', 400);
	}
};
