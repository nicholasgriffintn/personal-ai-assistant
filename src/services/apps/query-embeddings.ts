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

		// @ts-ignore
		if (!queryEmbedding.data) {
			throw new AppError('No embedding data found', 400);
		}

		// @ts-ignore
		const matchesResponse = await embedding.getMatches(queryEmbedding.data[0]);

		if (!matchesResponse.matches) {
			throw new AppError('No matches found', 400);
		}

		const matchesWithContent = await Promise.all(
			matchesResponse.matches.map(async (match) => {
				const record = await env.DB.prepare('SELECT metadata, type, title, content FROM documents WHERE id = ?1').bind(match.id).first();

				return {
					...match,
					content: record?.content,
				};
			})
		);

		return {
			status: 'success',
			data: matchesWithContent,
		};
	} catch (error) {
		console.error(error);
		throw new AppError('Error querying embeddings', 400);
	}
};
