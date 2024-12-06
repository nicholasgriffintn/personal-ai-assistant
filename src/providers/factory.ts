import { AnthropicProvider } from './anthropic';
import { GrokProvider } from './grok';
import { HuggingFaceProvider } from './huggingface';
import { PerplexityProvider } from './perplexity';
import { ReplicateProvider } from './replicate';
import { MistralProvider } from './mistral';
import { WorkersProvider } from './workers';
import { OpenRouterProvider } from './openrouter';
import { BedrockProvider } from './bedrock';
import { OpenAIProvider } from './openai';
import { GoogleStudioProvider } from './googlestudio';
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
		bedrock: new BedrockProvider(),
		openai: new OpenAIProvider(),
		'google-ai-studio': new GoogleStudioProvider(),
	};

	static getProvider(providerName: string): AIProvider {
		return this.providers[providerName] || this.providers.workers;
	}
}
