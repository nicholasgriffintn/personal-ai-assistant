import { AnthropicProvider } from "./anthropic";
import type { AIProvider } from "./base";
import { BedrockProvider } from "./bedrock";
import { GoogleStudioProvider } from "./googlestudio";
import { GrokProvider } from "./grok";
import { HuggingFaceProvider } from "./huggingface";
import { MistralProvider } from "./mistral";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";
import { PerplexityProvider } from "./perplexity";
import { ReplicateProvider } from "./replicate";
import { WorkersProvider } from "./workers";
import { GroqProvider } from "./groq";
import { OllamaProvider } from "./ollama";
import { GithubModelsProvider } from "./github";
import { DeepSeekProvider } from "./deepseek";

// biome-ignore lint/complexity/noStaticOnlyClass: CBA
export class AIProviderFactory {
	private static providers: Record<string, AIProvider> = {
		anthropic: new AnthropicProvider(),
		grok: new GrokProvider(),
		huggingface: new HuggingFaceProvider(),
		"perplexity-ai": new PerplexityProvider(),
		replicate: new ReplicateProvider(),
		mistral: new MistralProvider(),
		openrouter: new OpenRouterProvider(),
		workers: new WorkersProvider(),
		bedrock: new BedrockProvider(),
		openai: new OpenAIProvider(),
		"google-ai-studio": new GoogleStudioProvider(),
		groq: new GroqProvider(),
		ollama: new OllamaProvider(),
		"github-models": new GithubModelsProvider(),
		deepseek: new DeepSeekProvider(),
	};

	static getProviders(): string[] {
		return Object.keys(AIProviderFactory.providers);
	}

	static getProvider(providerName: string): AIProvider {
		return (
			AIProviderFactory.providers[providerName] ||
			AIProviderFactory.providers.workers
		);
	}
}
