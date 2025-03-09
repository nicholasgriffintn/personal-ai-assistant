import type { ModelConfig } from "../types";

export const availableCapabilities = [
	"research",
	"coding",
	"math",
	"creative",
	"analysis",
	"chat",
	"search",
	"multilingual",
	"reasoning",
	"vision",
	"summarization",
] as const;

export const availableModelTypes = [
	"text",
	"coding",
	"speech",
	"image-to-text",
	"image-to-image",
	"text-to-image",
	"embedding",
	"instruct",
	"text-to-video",
	"image-to-video",
] as const;

const modelConfig: ModelConfig = {
	auto: {
		name: "OpenRouter Auto",
		description: "OpenRouter's auto model, will select the best model for the task.",
		matchingModel: "openrouter/auto",
		provider: "openrouter",
		type: ["text"],
	},

	"mistral-large": {
		name: "Mistral Large",
		matchingModel: "mistral-large-latest",
		description: "Capable in code generation, mathematics, and reasoning with support for dozens of languages.",
		provider: "mistral",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		card: "https://www.prompthub.us/models/mistral-large",
		contextWindow: 128000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.006,
		strengths: ["chat", "analysis", "creative"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"mistral-small": {
		name: "Mistral Small",
		matchingModel: "mistral-small-latest",
		description:
			"Mistral Small is a lightweight model designed for cost-effective use in tasks like translation and summarization.",
		provider: "mistral",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		card: "https://www.prompthub.us/models/mistral-small",
		contextWindow: 32768,
		maxTokens: 4096,
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.006,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
		isFeatured: true,
		includedInRouter: true,
	},
	"mistral-nemo": {
		name: "Mistral Nemo",
		matchingModel: "open-mistral-nemo",
		description: "Trained jointly by Mistral AI and NVIDIA, it significantly outperforms existing models smaller or similar in size.",
		provider: "mistral",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		card: "https://www.prompthub.us/models/mistral-nemo",
		contextWindow: 32768,
		maxTokens: 4096,
		costPer1kInputTokens: 0.00015,
		costPer1kOutputTokens: 0.00015,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 3,
		reliability: 3,
		speed: 4,
		isFeatured: true,
		includedInRouter: true,
	},
	"pixtral-large": {
		name: "Pixtral Large",
		matchingModel: "pixtral-large-latest",
		provider: "mistral",
		type: ["image-to-text"],
		supportsFunctions: true,
		card: "https://www.prompthub.us/models/pixtral",
		contextWindow: 128000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.0002,
		costPer1kOutputTokens: 0.0006,
		strengths: ["vision", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	codestral: {
		name: "Codestral",
		matchingModel: "codestral-latest",
		description:
			"Codestral is Mistral AI's first-ever code model designed for code generation tasks.",
		provider: "mistral",
		type: ["coding"],
		isFree: true,
		card: "https://www.prompthub.us/models/codestral",
		contextWindow: 32000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.0002,
		costPer1kOutputTokens: 0.0006,
		strengths: ["coding", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"claude-3.5-sonnet": {
		name: "Claude 3.5 Sonnet",
		matchingModel: "claude-3-5-sonnet-latest",
		provider: "anthropic",
		type: ["text"],
	},
	"claude-3.7-sonnet": {
		name: "Claude 3.7 Sonnet",
		matchingModel: "claude-3-7-sonnet-latest",
		description: "Combined with state-of-the-art coding, vision, and writing skills, you can use this model for a variety of use cases.",
		provider: "anthropic",
		type: ["text"],
		card: "https://www.prompthub.us/models/claude-3-7-sonnet",
		contextWindow: 200000,
		maxTokens: 8192,
		costPer1kInputTokens: 0.003,
		costPer1kOutputTokens: 0.015,
		strengths: ["chat", "analysis", "coding", "reasoning", "creative"],
		contextComplexity: 5,
		reliability: 5,
		speed: 4,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"claude-3.5-haiku": {
		name: "Claude 3.5 Haiku",
		matchingModel: "claude-3-5-haiku-latest",
		description:
			"With fast speeds, improved instruction following, and more accurate tool use, Claude 3.5 Haiku is well suited for user-facing products, specialized sub-agent tasks, and generating personalized experiences from huge volumes of data.",
		provider: "anthropic",
		type: ["text"],
		card: "https://www.prompthub.us/models/claude-3-5-haiku",
		contextWindow: 80000,
		maxTokens: 8192,
		costPer1kInputTokens: 0.001,
		costPer1kOutputTokens: 0.005,
		strengths: ["chat", "analysis", "reasoning", "creative"],
		contextComplexity: 3,
		reliability: 3,
		speed: 5,
		isFeatured: true,
		includedInRouter: true,
	},
	"claude-3-opus": {
		name: "Claude 3 Opus",
		matchingModel: "claude-3-opus-latest",
		description:
			"The Claude 3.5 Opus is an advanced AI model by Anthropic designed for enterprise-level applications. It offers unmatched performance in handling complex tasks, making it an ideal solution for businesses requiring high-level data processing and analysis.",
		provider: "anthropic",
		type: ["text"],
		card: "https://www.prompthub.us/models/claude-3-opus",
		contextWindow: 200000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.015,
		costPer1kOutputTokens: 0.075,
		strengths: ["chat", "analysis", "reasoning", "creative"],
		contextComplexity: 5,
		reliability: 5,
		speed: 3,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"sonar-deep-research": {
		name: "Perplexity Sonar Deep Research",
		matchingModel: "sonar-deep-research",
		description: "Premier research offering with search grounding, supporting advanced queries and follow-ups.",
		provider: "perplexity-ai",
		type: ["text"],
		strengths: ["research", "analysis", "multilingual"],
		isFeatured: true,
		includedInRouter: true,
		costPer1kInputTokens: 0.002,
		costPer1kReasoningTokens: 0.003,
		costPer1kOutputTokens: 0.008,
		costPer1kSearches: 0.005,
	},
	"sonar-reasoning-pro": {
		name: "Perplexity Sonar Reasoning Pro",
		matchingModel: "sonar-reasoning-pro",
		description: "Premier reasoning offering powered by DeepSeek R1 with Chain of Thought (CoT).",
		provider: "perplexity-ai",
		type: ["text"],
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		isFeatured: true,
		includedInRouter: true,
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.008,
		costPer1kSearches: 0.005,
	},
	"sonar-reasoning": {
		name: "Perplexity Sonar Reasoning",
		matchingModel: "sonar-reasoning",
		description: "Standard reasoning offering with Chain of Thought (CoT) capabilities.",
		provider: "perplexity-ai",
		type: ["text"],
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		isFeatured: true,
		includedInRouter: true,
		costPer1kInputTokens: 0.001,
		costPer1kOutputTokens: 0.005,
		costPer1kSearches: 0.005,
	},
	"sonar-pro": {
		name: "Perplexity Sonar Pro",
		matchingModel: "sonar-pro",
		description: "Premier search offering with search grounding, supporting advanced queries and follow-ups.",
		provider: "perplexity-ai",
		type: ["text"],
		strengths: ["search", "analysis"],
		contextComplexity: 5,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
		costPer1kInputTokens: 0.003,
		costPer1kOutputTokens: 0.015,
		costPer1kSearches: 0.005,
	},
	"sonar": {
		name: "Perplexity Sonar",
		matchingModel: "sonar",
		description: "Lightweight offering with search grounding, quicker and cheaper than Sonar Pro.",
		provider: "perplexity-ai",
		type: ["text"],
		strengths: ["search", "analysis"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
		costPer1kInputTokens: 0.001,
		costPer1kOutputTokens: 0.001,
		costPer1kSearches: 0.005,
	},
	"r1-1776": {
		name: "Perplexity R1 1776",
		matchingModel: "r1-1776",
		description: "R1-1776 is a version of the DeepSeek R1 model that has been post-trained to provide uncensored, unbiased, and factual information.",
		provider: "perplexity-ai",
		type: ["text"],
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		costPer1kInputTokens: 0.002,
		costPer1kOutputTokens: 0.008,
	},
	"deepseek-chat": {
		name: "DeepSeek Chat",
		matchingModel: "deepseek/deepseek-chat",
		description:
			"DeepSeek's latest model optimized for coding, analysis, and mathematical tasks with strong reasoning capabilities.",
		provider: "openrouter",
		type: ["text"],
		card: "https://www.prompthub.us/models/deepseek-v3",
		contextWindow: 64000,
		maxTokens: 8000,
		costPer1kInputTokens: 0.00014,
		costPer1kOutputTokens: 0.00028,
		strengths: ["multilingual", "coding", "analysis"],
		contextComplexity: 4,
		reliability: 5,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"deepseek-reasoner": {
		name: "DeepSeek Reasoner",
		matchingModel: "deepseek-reasoner",
		provider: "deepseek",
		type: ["text"],
		card: "https://www.prompthub.us/models/deepseek-reasoner-r1",
		contextWindow: 64000,
		maxTokens: 8000,
		costPer1kInputTokens: 0.00055,
		costPer1kOutputTokens: 0.00219,
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		contextComplexity: 4,
		reliability: 5,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"deepseek-coder-6.7b": {
		name: "DeepSeek Coder 6.7B",
		matchingModel: "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
		description:
			"Deepseek Coder is composed of a series of code language models, each trained from scratch on 2T tokens, with a composition of 87% code and 13% natural language in both English and Chinese.",
		provider: "workers-ai",
		type: ["coding"],
		card: "https://www.prompthub.us/models/deepseek-coder-6.7b",
		contextWindow: 64000,
		maxTokens: 8000,
		costPer1kInputTokens: 0.00014,
		costPer1kOutputTokens: 0.00028,
	},
	o1: {
		name: "OpenAI o1",
		matchingModel: "o1",
		description:
			"Advanced model with exceptional capabilities in coding, analysis, math, reasoning, and multilingual support. Features a 200k context window and high reliability.",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
		card: "https://www.prompthub.us/models/o1",
		contextWindow: 200000,
		maxTokens: 100000,
		costPer1kInputTokens: 0.015,
		costPer1kOutputTokens: 0.06,
		strengths: ["coding", "analysis", "math", "reasoning", "multilingual"],
		contextComplexity: 5,
		reliability: 5,
		speed: 1,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"o3-mini": {
		name: "OpenAI o3 Mini",
		matchingModel: "o3-mini",
		description: "Fast, flexible, intelligent reasoning model",
		provider: "openai",
		type: ["text"],
		card: "https://www.prompthub.us/models/o3-mini",
		contextWindow: 200000,
		maxTokens: 100000,
		costPer1kInputTokens: 0.0011,
		costPer1kOutputTokens: 0.0044,
		strengths: ["coding", "analysis", "math", "reasoning", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"gpt-4o": {
		name: "OpenAI GPT-4o",
		matchingModel: "gpt-4o",
		description:
			"Enhanced GPT model with 128k context window, specialized in analysis, chat, coding, and multilingual tasks.",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
		card: "https://www.prompthub.us/models/gpt-4o",
		contextWindow: 128000,
		maxTokens: 16484,
		costPer1kInputTokens: 0.0025,
		costPer1kOutputTokens: 0.01,
		strengths: ["analysis", "chat", "coding", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 4,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"gpt-4o-mini": {
		name: "OpenAI GPT-4o Mini",
		matchingModel: "gpt-4o-mini",
		description:
			"Efficient version of GPT-4o optimized for faster response times while maintaining core capabilities.",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
		card: "https://www.prompthub.us/models/gpt-4o-mini",
		contextWindow: 128000,
		maxTokens: 16484,
		costPer1kInputTokens: 0.00015,
		costPer1kOutputTokens: 0.0006,
		strengths: ["analysis", "chat", "coding", "multilingual"],
		contextComplexity: 3,
		reliability: 3,
		speed: 5,
		isFeatured: true,
		includedInRouter: true,
	},
	"gpt-4-turbo": {
		name: "OpenAI GPT-4 Turbo",
		matchingModel: "gpt-4-turbo",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
	},
	"gpt-4": {
		name: "OpenAI GPT-4",
		matchingModel: "gpt-4",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
	},
	"gpt-4.5": {
		name: "OpenAI GPT-4.5",
		matchingModel: "gpt-4.5-preview",
		description:
			"GPT-4.5 excels at tasks that benefit from creative, open-ended thinking and conversation, such as writing, learning, or exploring new ideas.",
		provider: "openai",
		type: ["text"],
		supportsFunctions: true,
		card: "https://platform.openai.com/docs/models/gpt-4.5-preview",
		contextWindow: 128000,
		maxTokens: 4096,
		costPer1kInputTokens: 0.01,
		costPer1kOutputTokens: 0.03,
		strengths: ["coding", "analysis", "reasoning", "multilingual"],
		contextComplexity: 5,
		reliability: 5,
		speed: 4,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"gpt-3.5-turbo": {
		name: "OpenAI GPT-3.5 Turbo",
		matchingModel: "gpt-3.5-turbo",
		provider: "openai",
		type: ["text"],
	},
	whisper: {
		name: "OpenAI Whisper",
		matchingModel: "@cf/openai/whisper",
		provider: "workers-ai",
		type: ["speech"],
	},
	"gemini-2.0-flash": {
		name: "Google Gemini 2.0 Flash",
		matchingModel: "google/gemini-2.0-flash-001",
		description:
			"Latest Gemini model optimized for coding, analysis, math, and multilingual tasks with exceptional speed.",
		provider: "openrouter",
		type: ["text"],
		card: "https://www.prompthub.us/models/gemini-2-0-flash",
		contextWindow: 1048576,
		maxTokens: 8192,
		costPer1kInputTokens: 0,
		costPer1kOutputTokens: 0,
		strengths: ["coding", "analysis", "math", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 3,
		supportsFunctions: true,
		multimodal: true,
		isFeatured: true,
		includedInRouter: true,
	},
	"gemini-1.5-flash": {
		name: "Google Gemini 1.5 Flash",
		matchingModel: "google/gemini-flash-1.5",
		provider: "openrouter",
		type: ["text"],
	},
	"gemini-1.5-pro": {
		name: "Google Gemini 1.5 Pro",
		matchingModel: "google/gemini-pro-1.5",
		provider: "openrouter",
		type: ["text"],
	},
	"gemini-1.5-flash-8b": {
		name: "Google Gemini 1.5 Flash 8B",
		matchingModel: "google/gemini-flash-1.5-8b",
		provider: "openrouter",
		type: ["text"],
	},
	"gemini-2-0-pro": {
		name: "Google Gemini 2.0 Pro (beta)",
		matchingModel: "google/gemini-2.0-pro-exp-02-05:free",
		provider: "openrouter",
		type: ["text"],
		isBeta: true,
		card: "https://www.prompthub.us/models/gemini-2-0-pro",
	},
	"llama3-groq-70b": {
		name: "Groq Llama 3 70B",
		matchingModel: "llama3-groq-70b-8192-tool-use-preview",
		provider: "groq",
		type: ["text"],
		supportsFunctions: true,
	},
	"llama3-groq-8b": {
		name: "Groq Llama 3 8B",
		matchingModel: "llama3-groq-8b-8192-tool-use-preview",
		provider: "groq",
		type: ["text"],
		supportsFunctions: true,
	},
	"llama-3.3-70b-versatile": {
		name: "Groq Llama 3.3 70B Versatile",
		matchingModel: "llama-3.3-70b-versatile",
		provider: "groq",
		type: ["text"],
		card: "https://www.prompthub.us/models/llama-3-3-70b",
		contextWindow: 128000,
		maxTokens: 2048,
		costPer1kInputTokens: 0.00023,
		costPer1kOutputTokens: 0.0004,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 4,
		isFeatured: true,
		includedInRouter: true,
	},
	"llama-3.3-70b-specdec": {
		name: "Groq Llama 3.3 70B SpecDec",
		matchingModel: "llama-3.3-70b-specdec",
		provider: "groq",
		type: ["text"],
		card: "https://www.prompthub.us/models/llama-3-3-70b",
		contextWindow: 128000,
		maxTokens: 2048,
		costPer1kInputTokens: 0.00023,
		costPer1kOutputTokens: 0.0004,
		strengths: ["chat", "analysis", "creative", "multilingual"],
		contextComplexity: 4,
		reliability: 4,
		speed: 5,
		isFeatured: true,
		includedInRouter: true,
	},
	"Phi-3.5-MoE-instruct": {
		name: "Phi 3.5 MoE Instruct",
		matchingModel: "Phi-3.5-MoE-instruct",
		provider: "github-models",
		type: ["text"],
		card: "https://github.com/marketplace/models/azureml/Phi-3-5-MoE-instruct",
		contextWindow: 131000,
		maxTokens: 4096,
		costPer1kInputTokens: 0,
		costPer1kOutputTokens: 0,
		strengths: ["reasoning", "multilingual", "coding", "analysis"],
		contextComplexity: 4,
		reliability: 5,
		speed: 3,
		isFeatured: true,
		includedInRouter: true,
	},
	"phi-2": {
		name: "Phi 2",
		matchingModel: "@cf/microsoft/phi-2",
		description:
			"Phi-2 is a Transformer-based model with a next-word prediction objective, trained on 1.4T tokens from multiple passes on a mixture of Synthetic and Web datasets for NLP and coding.",
		provider: "workers-ai",
		type: ["text"],
	},
	"Phi-3.5-mini-instruct": {
		name: "Phi 3.5 Mini Instruct",
		matchingModel: "Phi-3.5-mini-instruct",
		provider: "github-models",
		type: ["text"],
	},
	"Phi-3.5-vision-instruct": {
		name: "Phi 3.5 Vision Instruct",
		matchingModel: "Phi-3.5-vision-instruct",
		provider: "github-models",
		type: ["image-to-text"],
	},
	"llama-3.3-70b-instruct": {
		name: "Meta Llama 3.3 70B Instruct",
		matchingModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
		description:
			"Meta's new 70B model that claims to have the same performance as the 450B model but more cost effective.",
		provider: "workers-ai",
		type: ["text"],
	},
	"llama-3.2-1b-instruct": {
		name: "Meta Llama 3.2 1B Instruct",
		matchingModel: "@cf/meta/llama-3.2-1b-instruct",
		description:
			"The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
		provider: "workers-ai",
		type: ["text"],
	},
	"llama-3.2-3b-instruct": {
		name: "Meta Llama 3.2 3B Instruct",
		matchingModel: "@cf/meta/llama-3.2-3b-instruct",
		description:
			"The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
		provider: "workers-ai",
		type: ["text"],
	},
	"llama-3.1-70b-instruct": {
		name: "Meta Llama 3.1 70B Instruct",
		matchingModel: "@cf/meta/llama-3.1-70b-instruct",
		description:
			"The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models. The Llama 3.1 instruction tuned text only models are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.",
		provider: "workers-ai",
		type: ["text"],
	},
	"ollama-llama-3.2-1b": {
		name: "Ollama Llama 3.2 1B",
		matchingModel: "llama3.2:1b",
		provider: "ollama",
		type: ["text"],
	},
	"ollama-llama-3.2-3b": {
		name: "Ollama Llama 3.2 3B",
		matchingModel: "llama3.2:3b",
		provider: "ollama",
		type: ["text"],
	},
	"hermes-2-pro-mistral-7b": {
		name: "Hermes 2 Pro Mistral 7B",
		matchingModel: "@hf/nousresearch/hermes-2-pro-mistral-7b",
		description:
			"An upgraded, retrained version of Nous Hermes 2, consisting of an updated and cleaned version of the OpenHermes 2.5 Dataset, as well as a newly introduced Function Calling and JSON Mode dataset developed in-house.",
		provider: "workers-ai",
		type: ["text"],
		supportsFunctions: true,
		isFree: true,
		isFeatured: true,
	},
	"grok": {
		name: "Grok",
		matchingModel: "grok-beta",
		description:
			"Comparable performance to Grok 2 but with improved efficiency, speed and capabilities.",
		provider: "grok",
		type: ["text"],
	},
	"embed-english": {
		name: "Cohere Embed English",
		matchingModel: "cohere.embed-english-v3",
		provider: "bedrock",
		type: ["embedding"],
	},
	"embed-multilingual": {
		name: "Cohere Embed Multilingual",
		matchingModel: "cohere.embed-multilingual-v3",
		provider: "bedrock",
		type: ["embedding"],
	},
	"command": {
		name: "Cohere Command",
		matchingModel: "cohere.command-text-v14",
		description:
			"An instruction-following conversational model that performs language tasks with high quality, more reliably and with a longer context than our base generative models.",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"command-light": {
		name: "Cohere Command Light",
		matchingModel: "cohere.command-light-text-v14",
		description:
			"A smaller, faster version of command. Almost as capable, but a lot faster.",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"command-r": {
		name: "Cohere Command R",
		matchingModel: "cohere.command-r-v1:0",
		description:
			"command-r-03-2024	Command R is an instruction-following conversational model that performs language tasks at a higher quality, more reliably, and with a longer context than previous models. It can be used for complex workflows like code generation, retrieval augmented generation (RAG), tool use, and agents.",
		provider: "bedrock",
		strengths: ["summarization"],
		type: ["text"],
	},
	"command-r-plus": {
		name: "Cohere Command R+",
		matchingModel: "cohere.command-r-plus-v1:0",
		description:
			"Command R+ is an instruction-following conversational model that performs language tasks at a higher quality, more reliably, and with a longer context than previous models. It is best suited for complex RAG workflows and multi-step tool use.",
		provider: "bedrock",
		strengths: ["summarization"],
		type: ["text"],
	},
	"titan-image-generator": {
		name: "Amazon Titan Image Generator",
		matchingModel: "amazon.titan-image-generator-v1",
		provider: "bedrock",
		type: ["text-to-image", "image-to-image"],
	},
	"titan-multimodal-embeddings": {
		name: "Amazon Titan Multimodal Embeddings",
		matchingModel: "amazon.titan-embed-image-v1",
		provider: "bedrock",
		type: ["embedding"],
	},
	"titan-text-embeddings": {
		name: "Amazon Titan Text Embeddings",
		matchingModel: "amazon.titan-embed-text-v2:0",
		provider: "bedrock",
		type: ["embedding"],
	},
	"titan-text-express": {
		name: "Amazon Titan Text Express",
		matchingModel: "amazon.titan-text-express-v1",
		description: "LLM offering a balance of price and performance.",
		provider: "bedrock",
		type: ["text", "coding", "instruct"],
	},
	"titan-text-lite": {
		name: "Amazon Titan Text Lite",
		matchingModel: "amazon.titan-text-lite-v1",
		description:
			"Cost-effective and highly customizable LLM. Right-sized for specific use cases, ideal for text generation tasks and fine-tuning.",
		provider: "bedrock",
		type: ["text", "coding"],
	},
	"titan-text-premier": {
		name: "Amazon Titan Text Premier",
		matchingModel: "amazon.titan-text-premier-v1:0",
		description:
			"Amazon Titan Text Premier is a powerful and advanced large language model (LLM) within the Amazon Titan Text family, designed to deliver superior performance across a wide range of enterprise applications. ",
		provider: "bedrock",
		type: ["text", "coding"],
	},
	"nova-canvas": {
		name: "Amazon Nova Canvas",
		matchingModel: "amazon.nova-canvas-v1:0",
		description:
			"Amazon Nova Canvas is a state-of-the-art image generation model that creates professional grade images from text or images provided in prompts. Amazon Nova Canvas also provides features that make it easy to edit images using text inputs, controls for adjusting color scheme and layout, and built-in controls to support safe and responsible use of AI.",
		provider: "bedrock",
		type: ["image-to-image"],
	},
	"nova-lite": {
		name: "Amazon Nova Lite",
		matchingModel: "amazon.nova-lite-v1:0",
		description:
			"Amazon Nova Lite is a very low-cost multimodal model that is lightning fast for processing image, video, and text inputs. Amazon Nova Lite's accuracy across a breadth of tasks, coupled with its lightning-fast speed, makes it suitable for a wide range of interactive and high-volume applications where cost is a key consideration.",
		provider: "bedrock",
		type: ["text"],
	},
	"nova-micro": {
		name: "Amazon Nova Micro",
		matchingModel: "amazon.nova-micro-v1:0",
		description:
			"Amazon Nova Micro is a text only model that delivers the lowest latency responses at very low cost. It is highly performant at language understanding, translation, reasoning, code completion, brainstorming, and mathematical problem-solving. With its generation speed of over 200 tokens per second, Amazon Nova Micro is ideal for applications that require fast responses.",
		provider: "bedrock",
		type: ["text"],
	},
	"nova-pro": {
		name: "Amazon Nova Pro",
		matchingModel: "amazon.nova-pro-v1:0",
		description:
			"Amazon Nova Pro is a highly capable multimodal model with the best combination of accuracy, speed, and cost for a wide range of tasks.  Amazon Nova Pro's capabilities, coupled with its industry-leading speed and cost efficiency, makes it a compelling model for almost any task, including video summarization, Q&A, mathematical reasoning, software development, and AI agents that can execute multi-step workflows.",
		provider: "bedrock",
		type: ["text"],
	},
	"nova-reel": {
		name: "Amazon Nova Reel",
		matchingModel: "amazon.nova-reel-v1:0",
		description:
			"Amazon Nova Reel is a state-of-the-art video generation model that allows customers to easily create high quality video from text and images. Amazon Nova Reel supports use of natural language prompts to control visual style and pacing, including camera motion control, and built-in controls to support safe and responsible use of AI.",
		provider: "bedrock",
		type: ["text-to-video", "image-to-video"],
	},
	"jamba-large": {
		name: "AI21 Jamba 1.5 Large",
		matchingModel: "ai21.jamba-1-5-large-v1:0",
		description:
			"Jamba 1.5 Large (94B active/398B total) is built for superior long context handling, speed, and quality. They mark the first time a non-Transformer model has been successfully scaled to the quality and strength of the market's leading models.",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"jamba-mini": {
		name: "AI21 Jamba 1.5 Mini",
		matchingModel: "ai21.jamba-1-5-mini-v1:0",
		description:
			"Jamba 1.5 Mini (12B active/52B total) is built for superior long context handling, speed, and quality. They mark the first time a non-Transformer model has been successfully scaled to the quality and strength of the market's leading models.",
		provider: "bedrock",
		type: ["text", "instruct"],
	},
	"jambda-instruct": {
		name: "AI21 Jambda Instruct",
		matchingModel: "ai21.jamba-instruct-v1:0",
		description:
			"Jambda Instruct is an aligned version of Jamba with additional training, chat capabilities, and safety guardrails to make it suitable for immediate and secure enterprise use.",
		provider: "bedrock",
		strengths: ["summarization"],
		type: ["text", "instruct"],
	},
	"smollm2-1.7b-instruct": {
		name: "HuggingFace SmolLM2 1.7B Instruct",
		matchingModel: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
		provider: "huggingface",
		type: ["text"],
		isFree: true,
	},
	"qwq-32b": {
		name: "QwQ 32B",
		matchingModel: "qwen/qwq-32b-preview",
		description:
			"QwQ is an experimental research model focused on advancing AI reasoning capabilities.",
		provider: "openrouter",
		type: ["text"],
	},
	"mythomax-l2-13b": {
		name: "Mythomax L2 13B",
		matchingModel: "gryphe/mythomax-l2-13b",
		description:
			"Advanced language model with strong text generation capabilities.",
		provider: "openrouter",
		type: ["text"],
	},
	"llava": {
		name: "HuggingFace Llava 1.5 7B",
		matchingModel: "@cf/llava-hf/llava-1.5-7b-hf",
		provider: "workers-ai",
		type: ["image-to-text"],
	},
	"flux": {
		name: "Black Forest Labs Flux 1 Schnell",
		matchingModel: "@cf/black-forest-labs/flux-1-schnell",
		description:
			"FLUX.1 [schnell] is a 12 billion parameter rectified flow transformer capable of generating images from text descriptions.",
		provider: "workers-ai",
		type: ["text-to-image"],
	},
	"stable-diffusion-1.5-img2img": {
		name: "Stable Diffusion 1.5 Img2Img",
		matchingModel: "@cf/runwayml/stable-diffusion-v1-5-img2img",
		provider: "workers-ai",
		type: ["image-to-image"],
	},
	"stable-diffusion-1.5-inpainting": {
		name: "Stable Diffusion 1.5 Inpainting",
		matchingModel: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
		provider: "workers-ai",
		type: ["image-to-image"],
	},
	"stable-diffusion-xl-base-1.0": {
		name: "Stable Diffusion XL Base 1.0",
		matchingModel: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
		description:
			"Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.",
		provider: "workers-ai",
		type: ["text-to-image"],
	},
	"stable-diffusion-xl-lightning": {
		name: "Stable Diffusion XL Lightning",
		matchingModel: "@cf/bytedance/stable-diffusion-xl-lightning",
		description:
			"SDXL-Lightning is a lightning-fast text-to-image generation model. It can generate high-quality 1024px images in a few steps.",
		provider: "workers-ai",
		type: ["text-to-image"],
	},
	"openchat": {
		name: "OpenChat 3.5",
		matchingModel: "@cf/openchat/openchat-3.5-0106",
		description:
			"OpenChat is an innovative library of open-source language models, fine-tuned with C-RLFT - a strategy inspired by offline reinforcement learning.",
		provider: "workers-ai",
		type: ["text"],
		isFree: true,
	},
	"sqlcoder": {
		name: "SQLCoder 7B",
		matchingModel: "@cf/defog/sqlcoder-7b-2",
		description:
			"SQLCoder is a model trained on SQL queries and their corresponding natural language descriptions. It can generate SQL queries from natural language descriptions and vice versa.",
		provider: "workers-ai",
		type: ["coding"],
		isFree: true,
	},
	"tinyllama": {
		name: "TinyLlama 1.1B Chat v1.0",
		matchingModel: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
		description:
			"The TinyLlama project aims to pretrain a 1.1B Llama model on 3 trillion tokens. This is the chat model finetuned on top of TinyLlama/TinyLlama-1.1B-intermediate-step-1431k-3T.",
		provider: "workers-ai",
		type: ["text"],
		isFree: true,
	},
	"una-cybertron-7b-v2": {
		name: "Una Cybertron 7B v2",
		matchingModel: "@cf/fblgit/una-cybertron-7b-v2-bf16",
		description:
			"Cybertron 7B v2 is a 7B MistralAI based model, best on it's series. It was trained with SFT, DPO and UNA (Unified Neural Alignment) on multiple datasets.",
		provider: "workers-ai",
		type: ["text"],
		isFree: true,
	},
	"bge-large-en-v1.5": {
		name: "BGE Large English v1.5",
		matchingModel: "@cf/baai/bge-base-en-v1.5",
		provider: "workers-ai",
		type: ["embedding"],
	},
};

export const defaultModel = "mistral-large";

export function getModelConfig(model?: string) {
	return (model && modelConfig[model]) || modelConfig[defaultModel];
}

export function getModelConfigByModel(model: string) {
	return model && modelConfig[model as keyof typeof modelConfig];
}

export function getMatchingModel(model: string = defaultModel) {
	return model && getModelConfig(model).matchingModel;
}

export function getModelConfigByMatchingModel(matchingModel: string) {
	for (const model in modelConfig) {
		if (
			modelConfig[model as keyof typeof modelConfig].matchingModel ===
			matchingModel
		) {
			return modelConfig[model as keyof typeof modelConfig];
		}
	}
	return null;
}

export function getModels() {
	return modelConfig;
}

export function getFreeModels() {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.isFree) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getFeaturedModels() {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.isFeatured) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getIncludedInRouterModels() {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.includedInRouter) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getModelsByCapability(capability: string) {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.strengths?.includes(capability as (typeof availableCapabilities)[number])) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}

export function getModelsByType(type: string) {
	return Object.entries(modelConfig).reduce((acc, [key, model]) => {
		if (model.type?.includes(type as (typeof availableModelTypes)[number])) {
			acc[key] = model;
		}
		return acc;
	}, {} as typeof modelConfig);
}
