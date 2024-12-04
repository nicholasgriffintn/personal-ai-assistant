import type { GuardrailsProvider } from '../../types';
import { BedrockGuardrailsProvider, type BedrockGuardrailsConfig } from './bedrock';
import { AppError } from '../../utils/errors';
import { LlamaGuardProvider, type LlamaGuardConfig } from './llamaguard';

export class GuardrailsProviderFactory {
	static getProvider(type: string, config: BedrockGuardrailsConfig | LlamaGuardConfig): GuardrailsProvider {
		switch (type) {
			case 'bedrock':
				if (!('guardrailId' in config)) {
					throw new AppError('Invalid config for Bedrock provider', 400);
				}
				return new BedrockGuardrailsProvider(config);
			case 'llamaguard':
				if (!('ai' in config)) {
					throw new AppError('Invalid config for LlamaGuard provider', 400);
				}
				return new LlamaGuardProvider(config as LlamaGuardConfig);
			default:
				throw new AppError(`Unsupported guardrails provider: ${type}`, 400);
		}
	}
}
