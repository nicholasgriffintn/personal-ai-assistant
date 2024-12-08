import type { VectorizeIndexInfo, Vectorize, VectorizeVector, VectorFloatArray, VectorizeAsyncMutation } from '@cloudflare/workers-types';

import type { EmbeddingProvider } from '../../types';
import { gatewayId } from '../chat';
import { AppError } from '../../utils/errors';

export interface VectorizeEmbeddingProviderConfig {
	ai: any;
	vector_db: Vectorize;
}

export class VectorizeEmbeddingProvider implements EmbeddingProvider {
	private ai: any;
	private vector_db: Vectorize;
	private topK: number = 15;
	private returnValues: boolean = false;
	private returnMetadata: 'none' | 'indexed' | 'all' = 'indexed';

	constructor(config: VectorizeEmbeddingProviderConfig) {
		this.ai = config.ai;
		this.vector_db = config.vector_db;
	}

	async generate(type: string, content: string, id: string, metadata: Record<string, any>): Promise<VectorizeVector[]> {
		try {
			const response = await this.ai.run(
				'@cf/baai/bge-base-en-v1.5',
				{ text: [content] },
				{
					gateway: {
						id: gatewayId,
						skipCache: false,
						cacheTtl: 172800,
					},
				}
			);

			if (!response.data) {
				throw new AppError('No data returned from Vectorize API', 500);
			}

			const uniqueId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

			// TODO: Storing the text in metadata doesn't really work, it gets cut off, we need to store it somewhere else
			const mergedMetadata = { ...metadata, text: content, type };

			return response.data.map((vector: any) => ({
				id: uniqueId,
				values: vector,
				metadata: mergedMetadata,
			}));
		} catch (error) {
			console.error('Vectorize Embedding API error:', error);
			throw error;
		}
	}

	async insert(embeddings: VectorizeVector[]): Promise<VectorizeAsyncMutation> {
		const response = await this.vector_db.upsert(embeddings);
		return response;
	}

	async getQuery(query: string): Promise<VectorizeVector> {
		return this.ai.run(
			'@cf/baai/bge-base-en-v1.5',
			{ text: [query] },
			{
				gateway: {
					id: gatewayId,
					skipCache: false,
					cacheTtl: 172800,
				},
			}
		);
	}

	async getMatches(queryVector: VectorFloatArray) {
		const matches = await this.vector_db.query(queryVector, {
			topK: this.topK,
			returnValues: this.returnValues,
			returnMetadata: this.returnMetadata,
		});

		return matches;
	}

	async getVectors(ids: string[]): Promise<VectorizeVector[]> {
		return this.vector_db.getByIds(ids);
	}

	async deleteVectors(ids: string[]): Promise<VectorizeAsyncMutation> {
		return this.vector_db.deleteByIds(ids);
	}

	async describe(): Promise<VectorizeIndexInfo> {
		return this.vector_db.describe();
	}
}
