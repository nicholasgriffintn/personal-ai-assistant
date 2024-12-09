import type {
	Ai,
	D1Database,
	VectorFloatArray,
	Vectorize,
	VectorizeVector,
} from "@cloudflare/workers-types";

import type {
	EmbeddingProvider,
	EmbeddingVector,
	EmbeddingQueryResult,
	EmbeddingMutationResult,
} from "../../types";
import { AppError } from "../../utils/errors";
import { gatewayId } from "../chat";

export interface VectorizeEmbeddingProviderConfig {
	ai: Ai;
	vector_db: Vectorize;
	db: D1Database;
}

export class VectorizeEmbeddingProvider implements EmbeddingProvider {
	private ai: Ai;
	private vector_db: Vectorize;
	private db: D1Database;
	private topK = 15;
	private returnValues = false;
	private returnMetadata: "none" | "indexed" | "all" = "none";

	constructor(config: VectorizeEmbeddingProviderConfig) {
		this.ai = config.ai;
		this.db = config.db;
		this.vector_db = config.vector_db;
	}

	async generate(
		type: string,
		content: string,
		id: string,
		metadata: Record<string, string>,
	): Promise<EmbeddingVector[]> {
		try {
			if (!type || !content || !id) {
				throw new AppError("Missing type, content or id from request", 400);
			}

			const response = await this.ai.run(
				"@cf/baai/bge-base-en-v1.5",
				{ text: [content] },
				{
					gateway: {
						id: gatewayId,
						skipCache: false,
						cacheTtl: 172800,
					},
				},
			);

			if (!response.data) {
				throw new AppError("No data returned from Vectorize API", 500);
			}

			const mergedMetadata = { ...metadata, type };

			return response.data.map((vector: number[]) => ({
				id,
				values: vector,
				metadata: mergedMetadata,
			}));
		} catch (error) {
			console.error("Vectorize Embedding API error:", error);
			throw error;
		}
	}

	async insert(
		embeddings: EmbeddingVector[],
	): Promise<EmbeddingMutationResult> {
		await this.vector_db.upsert(embeddings as VectorizeVector[]);
		return {
			status: "success",
			error: null,
		};
	}

	async getQuery(
		query: string,
	): Promise<{ data: any; status: { success: boolean } }> {
		const response = await this.ai.run(
			"@cf/baai/bge-base-en-v1.5",
			{ text: [query] },
			{
				gateway: {
					id: gatewayId,
					skipCache: false,
					cacheTtl: 172800,
				},
			},
		);

		return {
			data: response.data,
			status: { success: true },
		};
	}

	async getMatches(
		queryVector: VectorFloatArray,
	): Promise<EmbeddingQueryResult> {
		const matches = await this.vector_db.query(queryVector, {
			topK: this.topK,
			returnValues: this.returnValues,
			returnMetadata: this.returnMetadata,
		});

		return {
			matches:
				matches.matches?.map((match) => ({
					id: match.id,
					score: match.score || 0,
					metadata: match.metadata || {},
				})) || [],
			count: matches.matches?.length || 0,
		};
	}

	async searchSimilar(
		query: string,
		options: {
			topK?: number;
			scoreThreshold?: number;
		} = {},
	) {
		const queryVector = await this.getQuery(query);

		if (!queryVector.data) {
			throw new AppError("No embedding data found", 400);
		}

		const matchesResponse = await this.getMatches(queryVector.data[0]);

		if (!matchesResponse.matches.length) {
			throw new AppError("No matches found", 400);
		}

		const filteredMatches = matchesResponse.matches
			.filter((match) => match.score >= (options.scoreThreshold || 0))
			.slice(0, options.topK || 3);

		const matchesWithContent = await Promise.all(
			filteredMatches.map(async (match) => {
				const record = await this.db
					.prepare(
						"SELECT metadata, type, title, content FROM documents WHERE id = ?1",
					)
					.bind(match.id)
					.first();

				return {
					title: record?.title as string,
					content: record?.content as string,
					metadata: record?.metadata || match.metadata || {},
					score: match.score || 0,
					type: (record?.type as string) || (match.metadata?.type as string),
				};
			}),
		);

		return matchesWithContent;
	}
}
