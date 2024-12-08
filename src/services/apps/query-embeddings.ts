import { Embedding } from "../../lib/embedding";
import { AppError } from "../../utils/errors";

export const queryEmbeddings = async (req: any): Promise<any> => {
	try {
		const { request, env } = req;

		const { query } = request;

		if (!query) {
			throw new AppError("Missing query from request", 400);
		}

		const embedding = Embedding.getInstance(env);

		const matchesWithContent = await embedding.searchSimilar(query);

		return {
			status: "success",
			data: matchesWithContent,
		};
	} catch (error) {
		console.error(error);
		throw new AppError("Error querying embeddings", 400);
	}
};
