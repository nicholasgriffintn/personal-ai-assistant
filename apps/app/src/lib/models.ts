import type { ChatModel } from "../types";

export const defaultModel = "mistral-small";

// NOTE: Compatible Web LLM models can be found here: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts#L311
export const modelsOptions: ChatModel[] = [
	{
		id: "mistral-large",
		name: "Mistral Large (Mistral)",
		description:
			"Mistral Large is significantly more capable in code generation, mathematics, and reasoning with 128k context window and support for dozens of languages.",
		capabilities: ["text-generation"],
		isFree: true,
	},
	{
		id: "mistral-nemo",
		name: "Mistral Nemo (Mistral)",
		description:
			"The Mistral-Nemo-Instruct-2407 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-Nemo-Base-2407. Trained jointly by Mistral AI and NVIDIA, it significantly outperforms existing models smaller or similar in size.",
		capabilities: ["text-generation"],
		isFree: true,
	},
	{
		id: "claude-3-7-sonnet",
		name: "Claude 3.7 - Sonnet (Anthropic)",
		description:
			"Claude 3.7 Sonnet can understand nuanced instructions and context, recognize and correct its own mistakes, and can create sophisticated analysis and insights from complex data. Combined with state-of-the-art coding, vision, and writing skills, you can use Claude 3.7 Sonnet for a variety of use cases.",
		capabilities: [
			"text-generation",
			"code-generation",
			"computer-use",
			"vision",
		],
	},
	{
		id: "llama-3.1-sonar-small-128k-online",
		name: "Llama 3.1 - Sonar Small 128k Online (Perplexity)",
		description:
			"Offers fast, precise processing for interactive applications, ensuring high-quality, fact-based responses ideal for dynamic environments requiring online timely information.",
		capabilities: ["text-generation"],
	},
	{
		id: "codestral",
		name: "Codestral (Mistral)",
		description:
			"Codestral is Mistral AI's first-ever code model designed for code generation tasks.",
		capabilities: ["coding"],
		isFree: true,
	},
	{
		id: "hermes-2-pro-mistral-7b",
		name: "Hermes 2 Pro - Mistral 7B",
		description:
			"Hermes 2 Pro on Mistral 7B is the new flagship 7B Hermes! Hermes 2 Pro is an upgraded, retrained version of Nous Hermes 2, consisting of an updated and cleaned version of the OpenHermes 2.5 Dataset, as well as a newly introduced Function Calling and JSON Mode dataset developed in-house.",
		capabilities: ["function-calling", "text-generation"],
		isFree: true,
	},
	{
		id: "llama-3.3-70b-instruct",
		name: "Llama 3.3 - 70B Instruct",
		description:
			"Meta's new 70B model that claims to have the same performance as the 450B model but more cost effective.",
		capabilities: ["text-generation"],
	},
	{
		id: "claude-3.5-haiku",
		name: "Claude 3.5 - Haiku (Anthropic)",
		description:
			"With fast speeds, improved instruction following, and more accurate tool use, Claude 3.5 Haiku is well suited for user-facing products, specialized sub-agent tasks, and generating personalized experiences from huge volumes of data.",
		capabilities: [
			"text-generation",
			"code-generation",
			"labelling",
			"moderation",
		],
	},
	{
		id: "claude-3.5-opus",
		name: "Claude 3.5 - Opus (Anthropic)",
		description:
			"The Claude 3.5 Opus is an advanced AI model by Anthropic designed for enterprise-level applications. It offers unmatched performance in handling complex tasks, making it an ideal solution for businesses requiring high-level data processing and analysis.",
		capabilities: ["text-generation", "code-generation"],
	},
	{
		id: "llama-3.1-sonar-large-128k-online",
		name: "Llama 3.1 - Sonar Large 128k Online (Perplexity)",
		description:
			"Offers fast, precise processing for interactive applications, ensuring high-quality, fact-based responses ideal for dynamic environments requiring online timely information.",
		capabilities: ["text-generation"],
	},
	{
		id: "llama-3.1-sonar-huge-128k-online",
		name: "Llama 3.1 - Sonar Huge 128k Online (Perplexity)",
		description:
			"Offers fast, precise processing for interactive applications, ensuring high-quality, fact-based responses ideal for dynamic environments requiring online timely information.",
		capabilities: ["text-generation"],
	},
	{
		id: "nova-micro",
		name: "Nova Micro (Bedrock)",
		description:
			"Amazon Nova Micro is a text only model that delivers the lowest latency responses at very low cost. It is highly performant at language understanding, translation, reasoning, code completion, brainstorming, and mathematical problem-solving. With its generation speed of over 200 tokens per second, Amazon Nova Micro is ideal for applications that require fast responses.",
		capabilities: ["text-generation"],
	},
	{
		id: "nova-lite",
		name: "Nova Lite (Bedrock)",
		description:
			"Amazon Nova Lite is a very low-cost multimodal model that is lightning fast for processing image, video, and text inputs. Amazon Nova Lite's accuracy across a breadth of tasks, coupled with its lightning-fast speed, makes it suitable for a wide range of interactive and high-volume applications where cost is a key consideration.",
		capabilities: ["text-generation"],
	},
	{
		id: "nova-pro",
		name: "Nova Pro (Bedrock)",
		description:
			"Amazon Nova Pro is a highly capable multimodal model with the best combination of accuracy, speed, and cost for a wide range of tasks.  Amazon Nova Pro's capabilities, coupled with its industry-leading speed and cost efficiency, makes it a compelling model for almost any task, including video summarization, Q&A, mathematical reasoning, software development, and AI agents that can execute multi-step workflows.",
		capabilities: ["text-generation"],
	},
	{
		id: "nova-reel",
		name: "Nova Reel (Bedrock)",
		description:
			"Amazon Nova Reel is a state-of-the-art video generation model that allows customers to easily create high quality video from text and images. Amazon Nova Reel supports use of natural language prompts to control visual style and pacing, including camera motion control, and built-in controls to support safe and responsible use of AI.",
		capabilities: ["text-to-video"],
	},
	{
		id: "nova-canvas",
		name: "Nova Canvas (Bedrock)",
		description:
			"Amazon Nova Canvas is a state-of-the-art image generation model that creates professional grade images from text or images provided in prompts. Amazon Nova Canvas also provides features that make it easy to edit images using text inputs, controls for adjusting color scheme and layout, and built-in controls to support safe and responsible use of AI.",
		capabilities: ["text-to-image"],
	},
	{
		id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
		name: "Llama 3.2 1B Instruct (Q4F32)",
		description: "Quantized Llama 3.2 1B model optimized for web browsers",
		capabilities: ["text-generation"],
		isLocal: true,
	},
	{
		id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
		name: "Llama 3.2 3B Instruct (Q4F32)",
		description: "Quantized Llama 3.2 3B model optimized for web browsers",
		capabilities: ["text-generation"],
		isLocal: true,
	},
	{
		id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
		name: "Llama 3.1 8B Instruct (Q4F32)",
		description: "Quantized Llama 3.1 8B model optimized for web browsers",
		capabilities: ["text-generation"],
		isLocal: true,
	},
	{
		id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
		name: "Mistral 7B Instruct v0.3 (Q4F16)",
		description: "Latest Mistral 7B v0.3 model optimized for web browsers",
		capabilities: ["text-generation"],
		isLocal: true,
	},
	{
		id: "gemma-2-2b-it-q4f32_1-MLC",
		name: "Gemma 2 2B IT (Q4F32)",
		description: "Google's Gemma 2B instruction-tuned model",
		capabilities: ["text-generation"],
		isLocal: true,
	},
	{
		id: "gemma-2-9b-it-q4f32_1-MLC",
		name: "Gemma 2 9B IT (Q4F32)",
		description: "Google's Gemma 9B instruction-tuned model",
		capabilities: ["text-generation"],
		isLocal: true,
	},
	{
		id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
		name: "SmolLM2 1.7B Instruct (Q4F16)",
		description: "Efficient small language model optimized for web browsers",
		capabilities: ["text-generation"],
		isLocal: true,
		isFree: true,
	},
	{
		id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
		name: "TinyLlama 1.1B Chat v1.0 (Q4F16)",
		description: "Efficient tiny language model optimized for web browsers",
		capabilities: ["text-generation"],
		isLocal: true,
	},
	{
		id: "qwq",
		name: "QWQ (OpenRouter)",
		description:
			"QwQ is an experimental research model focused on advancing AI reasoning capabilities.",
		capabilities: ["text-generation"],
	},
	{
		id: "command",
		name: "Cohere Command (Bedrock)",
		description:
			"An instruction-following conversational model that performs language tasks with high quality, more reliably and with a longer context than our base generative models.",
		capabilities: ["text-generation"],
	},
	{
		id: "command-light",
		name: "Cohere Command Light (Bedrock)",
		description:
			"A smaller, faster version of command. Almost as capable, but a lot faster.",
		capabilities: ["text-generation"],
	},
	{
		id: "command-r",
		name: "Cohere Command R (Bedrock)",
		description:
			"command-r-03-2024	Command R is an instruction-following conversational model that performs language tasks at a higher quality, more reliably, and with a longer context than previous models. It can be used for complex workflows like code generation, retrieval augmented generation (RAG), tool use, and agents.",
		capabilities: ["text-generation"],
	},
	{
		id: "command-r-plus",
		name: "Cohere Command R Plus (Bedrock)",
		description:
			"Command R+ is an instruction-following conversational model that performs language tasks at a higher quality, more reliably, and with a longer context than previous models. It is best suited for complex RAG workflows and multi-step tool use.",
		capabilities: ["text-generation"],
	},
	{
		id: "titan-text-express",
		name: "Titan Text Express (Bedrock)",
		description: "LLM offering a balance of price and performance.",
		capabilities: ["text-generation"],
	},
	{
		id: "titan-text-lite",
		name: "Titan Text Lite (Bedrock)",
		description:
			"Cost-effective and highly customizable LLM. Right-sized for specific use cases, ideal for text generation tasks and fine-tuning.",
		capabilities: ["text-generation"],
	},
	{
		id: "titan-text-premier",
		name: "Titan Text Premier (Bedrock)",
		description:
			"Amazon Titan Text Premier is a powerful and advanced large language model (LLM) within the Amazon Titan Text family, designed to deliver superior performance across a wide range of enterprise applications. ",
		capabilities: ["text-generation"],
	},
	{
		id: "grok",
		name: "Grok",
		description:
			"Comparable performance to Grok 2 but with improved efficiency, speed and capabilities.",
		capabilities: ["text-generation", "code-generation"],
	},
	{
		id: "sqlcoder",
		name: "SQLCoder",
		description:
			"SQLCoder is a model trained on SQL queries and their corresponding natural language descriptions. It can generate SQL queries from natural language descriptions and vice versa.",
		capabilities: ["code-generation"],
		isFree: true,
	},
	{
		id: "deepseek-coder-6.7b",
		name: "DeepSeek Coder 6.7B",
		description:
			"Deepseek Coder is composed of a series of code language models, each trained from scratch on 2T tokens, with a composition of 87% code and 13% natural language in both English and Chinese.",
		capabilities: ["code-generation"],
	},
	{
		id: "stable-diffusion-xl-lightning",
		name: "Stable Diffusion XL Lightning",
		description:
			"SDXL-Lightning is a lightning-fast text-to-image generation model. It can generate high-quality 1024px images in a few steps.",
		capabilities: ["text-to-image"],
	},
	{
		id: "flux",
		name: "Flux",
		description:
			"FLUX.1 [schnell] is a 12 billion parameter rectified flow transformer capable of generating images from text descriptions.",
		capabilities: ["text-to-image"],
	},
	{
		id: "stable-diffusion-xl-base-1.0",
		name: "Stable Diffusion XL Base 1.0",
		description:
			"Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.",
		capabilities: ["text-to-image"],
	},
	{
		id: "mistral-small",
		name: "Mistral Small (Mistral)",
		description:
			"Mistral Small is a lightweight model designed for cost-effective use in tasks like translation and summarization.",
		capabilities: ["text-generation"],
		isFree: true,
	},
	{
		id: "llama-3.2-3b-instruct",
		name: "Llama 3.2 - 3B Instruct",
		description:
			"The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
		capabilities: ["text-generation"],
	},
	{
		id: "phi-2",
		name: "Phi 2",
		description:
			"Phi-2 is a Transformer-based model with a next-word prediction objective, trained on 1.4T tokens from multiple passes on a mixture of Synthetic and Web datasets for NLP and coding.",
		capabilities: ["text-generation"],
	},
	{
		id: "openchat",
		name: "OpenChat",
		description:
			"OpenChat is an innovative library of open-source language models, fine-tuned with C-RLFT - a strategy inspired by offline reinforcement learning.",
		capabilities: ["text-generation"],
		isFree: true,
	},
	{
		id: "tinyllama",
		name: "TinyLlama",
		description:
			"The TinyLlama project aims to pretrain a 1.1B Llama model on 3 trillion tokens. This is the chat model finetuned on top of TinyLlama/TinyLlama-1.1B-intermediate-step-1431k-3T.",
		capabilities: ["text-generation"],
		isFree: true,
	},
	{
		id: "una-cybertron-7b-v2",
		name: "Una Cybertron 7B V2",
		description:
			"Cybertron 7B v2 is a 7B MistralAI based model, best on it's series. It was trained with SFT, DPO and UNA (Unified Neural Alignment) on multiple datasets.",
		capabilities: ["text-generation"],
		isFree: true,
	},
	{
		id: "llama-3.1-70b-instruct",
		name: "Llama 3.1 - 70B Instruct",
		description:
			"The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models. The Llama 3.1 instruction tuned text only models are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.",
		capabilities: ["text-generation"],
	},
	{
		id: "llama-3.2-1b-instruct",
		name: "Llama 3.2 - 1B Instruct",
		description:
			"The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.",
		capabilities: ["text-generation"],
	},
	{
		id: "jamba-mini",
		name: "ai21labs Jamba Mini (Bedrock)",
		description:
			"Jamba 1.5 Mini (12B active/52B total) is built for superior long context handling, speed, and quality. They mark the first time a non-Transformer model has been successfully scaled to the quality and strength of the market's leading models.",
		capabilities: ["text-generation"],
	},
	{
		id: "jamba-large",
		name: "ai21labs Jamba Large (Bedrock)",
		description:
			"Jamba 1.5 Large (94B active/398B total) is built for superior long context handling, speed, and quality. They mark the first time a non-Transformer model has been successfully scaled to the quality and strength of the market's leading models.",
		capabilities: ["text-generation"],
	},
	{
		id: "jambda-instruct",
		name: "ai21labs Jambda Instruct (Bedrock)",
		description:
			"Jambda Instruct is an aligned version of Jamba with additional training, chat capabilities, and safety guardrails to make it suitable for immediate and secure enterprise use.",
		capabilities: ["text-generation"],
	},
	{
		id: "deepseek-v3",
		name: "DeepSeek V3",
		description:
			"DeepSeek's latest model optimized for coding, analysis, and mathematical tasks with strong reasoning capabilities.",
		capabilities: ["text-generation", "code-generation", "analysis"],
	},
	{
		id: "o1",
		name: "o1",
		description:
			"Advanced model with exceptional capabilities in coding, analysis, math, reasoning, and multilingual support. Features a 200k context window and high reliability.",
		capabilities: ["text-generation", "code-generation", "function-calling"],
	},
	{
		id: "o3-mini",
		name: "o3 Mini",
		description: "Fast, flexible, intelligent reasoning model",
		capabilities: ["text-generation", "code-generation"],
	},
	{
		id: "gpt-4o",
		name: "GPT-4o",
		description:
			"Enhanced GPT model with 128k context window, specialized in analysis, chat, coding, and multilingual tasks.",
		capabilities: ["text-generation", "code-generation", "function-calling"],
	},
	{
		id: "gpt-4.5",
		name: "GPT-4.5",
		description:
			"GPT-4.5 excels at tasks that benefit from creative, open-ended thinking and conversation, such as writing, learning, or exploring new ideas.",
		capabilities: ["text-generation", "code-generation"],
	},
	{
		id: "gpt-4o-mini",
		name: "GPT-4o Mini",
		description:
			"Efficient version of GPT-4o optimized for faster response times while maintaining core capabilities.",
		capabilities: ["text-generation", "code-generation", "function-calling"],
	},
	{
		id: "gemini-2.0-flash",
		name: "Gemini 2.0 Flash",
		description:
			"Latest Gemini model optimized for coding, analysis, math, and multilingual tasks with exceptional speed.",
		capabilities: ["text-generation", "code-generation", "function-calling"],
	},
	{
		id: "mythomax-l2-13b",
		name: "MythoMax L2 13B",
		description:
			"Advanced language model with strong text generation capabilities.",
		capabilities: ["text-generation"],
	},
];

export const getAvailableModels = (hasApiKey: boolean) => {
	if (hasApiKey) {
		return modelsOptions;
	}

	return modelsOptions.filter((model) => model.isLocal || model.isFree);
};
