import type { VectorizeVector, VectorFloatArray, VectorizeMatches, VectorizeAsyncMutation } from '@cloudflare/workers-types';

import type { EmbeddingProvider, IEnv } from '../../types';
import { EmbeddingProviderFactory } from './factory';

export class Embedding {
	private static instance: Embedding;
	private provider: EmbeddingProvider;
	private env: IEnv;

	private constructor(env: IEnv) {
		this.env = env;

		this.provider = EmbeddingProviderFactory.getProvider('vectorize', {
			ai: this.env.AI,
			vector_db: this.env.VECTOR_DB,
		});
	}

	public static getInstance(env: any): Embedding {
		if (!Embedding.instance) {
			Embedding.instance = new Embedding(env);
		}
		return Embedding.instance;
	}

	async generate(content: string, id: string, metadata: Record<string, any>): Promise<VectorizeVector[]> {
		return await this.provider.generate(content, id, metadata);
	}

	async insert(embeddings: VectorizeVector[]): Promise<VectorizeAsyncMutation> {
		return await this.provider.insert(embeddings);
	}

	async getQuery(query: string): Promise<VectorizeVector> {
		return await this.provider.getQuery(query);
	}

	async getMatches(queryVector: VectorFloatArray): Promise<VectorizeMatches> {
		return await this.provider.getMatches(queryVector);
	}
}
