import { AnthropicProvider } from './anthropic';
import { GrokProvider } from './grok';
import { HuggingFaceProvider } from './huggingface';
import { PerplexityProvider } from './perplexity';
import { ReplicateProvider } from './replicate';
import { MistralProvider } from './mistral';
import { WorkersProvider } from './workers';
import { OpenRouterProvider } from './openrouter';
import type { AIProvider } from './base';

export class AIProviderFactory {
	private static providers: Record<string, AIProvider> = {
		anthropic: new AnthropicProvider(),
		grok: new GrokProvider(),
		huggingface: new HuggingFaceProvider(),
		'perplexity-ai': new PerplexityProvider(),
		replicate: new ReplicateProvider(),
		mistral: new MistralProvider(),
		openrouter: new OpenRouterProvider(),
		workers: new WorkersProvider(),
	};

	static getProvider(providerName: string): AIProvider {
		return this.providers[providerName] || this.providers.workers;
	}
}
