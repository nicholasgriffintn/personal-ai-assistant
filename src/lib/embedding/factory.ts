import type { EmbeddingProvider } from '../../types';
import { AppError } from '../../utils/errors';
import { VectorizeEmbeddingProvider, type VectorizeEmbeddingProviderConfig } from './vectorize';

export class EmbeddingProviderFactory {
	static getProvider(type: string, config: VectorizeEmbeddingProviderConfig): EmbeddingProvider {
		switch (type) {
			case 'vectorize':
				return new VectorizeEmbeddingProvider(config);
			default:
				throw new AppError(`Unsupported embedding provider: ${type}`, 400);
		}
	}
}
