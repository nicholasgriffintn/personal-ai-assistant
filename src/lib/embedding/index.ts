import type { VectorizeVector, VectorFloatArray, VectorizeMatches, VectorizeAsyncMutation } from '@cloudflare/workers-types';

import type { EmbeddingProvider, IEnv, RagOptions } from '../../types';
import { EmbeddingProviderFactory } from './factory';

export class Embedding {
	private static instance: Embedding;
	private provider: EmbeddingProvider;
	private env: IEnv;

	private constructor(env: IEnv) {
		this.env = env;

		this.provider = EmbeddingProviderFactory.getProvider('vectorize', {
			ai: this.env.AI,
			db: this.env.DB,
			vector_db: this.env.VECTOR_DB,
		});
	}

	public static getInstance(env: any): Embedding {
		if (!Embedding.instance) {
			Embedding.instance = new Embedding(env);
		}
		return Embedding.instance;
	}

	async generate(type: string, content: string, id: string, metadata: Record<string, any>): Promise<VectorizeVector[]> {
		return await this.provider.generate(type, content, id, metadata);
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

	async searchSimilar(
		query: string,
		options?: {
			topK?: number;
			scoreThreshold?: number;
		}
	) {
		return await this.provider.searchSimilar(query, options);
	}

	async augmentPrompt(query: string, options?: RagOptions): Promise<string> {
		try {
			const relevantDocs = await this.searchSimilar(query, {
				topK: options?.topK || 3,
				scoreThreshold: options?.scoreThreshold || 0.7,
			});

			if (!relevantDocs.length) {
				return query;
			}

			const shouldIncludeMetadata = options?.includeMetadata ?? true;
			const metadata = shouldIncludeMetadata ? { title: true, type: true, score: true } : {};

			const prompt = `
Context information is below.
---------------------
${relevantDocs
	.map((doc) => {
		const parts = [];
		if (metadata.type && doc.type) parts.push(`[${doc.type.toUpperCase()}]`);
		if (metadata.title && doc.title) parts.push(doc.title);

		return `
${parts.join(' ')}
${doc.content}
${metadata.score ? `Score: ${(doc.score * 100).toFixed(1)}%` : ''}
`.trim();
	})
	.join('\n\n')}
---------------------
Given the context information and not prior knowledge, answer the query: ${query}
    `.trim();

			return prompt;
		} catch (error) {
			console.error(error);
			return query;
		}
	}
}
