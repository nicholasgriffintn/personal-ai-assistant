import type { IEnv, PromptRequirements } from "../types";
import { AIProviderFactory } from "../providers/factory";
import { AppError } from "../utils/errors";
import { availableFunctions } from "../services/functions";

// biome-ignore lint/complexity/noStaticOnlyClass: I don't care
export class PromptAnalyzer {
	private static async analyzeWithAI(
		env: IEnv,
		prompt: string,
		keywords: string[],
	): Promise<PromptRequirements> {
		const provider = AIProviderFactory.getProvider("mistral");

		const availableCapabilities = [
			"coding",
			"math",
			"creative",
			"analysis",
			"chat",
			"search",
			"multilingual",
			"reasoning",
		];

		const analysis = await provider.getResponse({
			env,
			model: "mistral-small",
			messages: [
				{
					role: "system",
					content: `Analyze the given prompt and return a JSON object with the following properties:
                    - expectedComplexity: number 1-5 indicating task complexity
                    - requiredCapabilities: array of required model capabilities from ${JSON.stringify(
											availableCapabilities,
											null,
											2,
										)}
                    - estimatedInputTokens: estimated number of input tokens
                    - estimatedOutputTokens: estimated number of output tokens
                    - needsFunctions: boolean indicating if the task requires function calling based on the available tools: ${JSON.stringify(
											availableFunctions,
											null,
											2,
										)}
                    
                    Base the analysis on these keywords: ${keywords.join(", ")}`,
				},
				{
					role: "user",
					content: prompt,
				},
			],
		});

		if (!analysis.response) {
			throw new AppError("No response from AI", 500);
		}

		const jsonMatch = analysis.choices[0].message.content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new AppError("Invalid AI response format", 500);
		}

		const cleanedJson = jsonMatch[0].replace(/(\d+)-(\d+)/g, "$2");

		const requirements: PromptRequirements = {
			...JSON.parse(cleanedJson),
			hasImages: false,
		};

		requirements.expectedComplexity = Math.max(
			1,
			Math.min(5, requirements.expectedComplexity),
		);
		requirements.estimatedInputTokens = Math.max(
			0,
			requirements.estimatedInputTokens,
		);
		requirements.estimatedOutputTokens = Math.max(
			0,
			requirements.estimatedOutputTokens,
		);

		return requirements;
	}

	private static extractKeywords(prompt: string): string[] {
		const codingKeywords = ["code", "program", "function", "debug"];
		const mathKeywords = ["calculate", "solve", "equation", "math"];

		return prompt
			.toLowerCase()
			.split(" ")
			.filter((word) => [...codingKeywords, ...mathKeywords].includes(word));
	}

	public static async analyzePrompt(
		env: IEnv,
		prompt: string,
		attachments?: any[],
		budgetConstraint?: number,
	): Promise<PromptRequirements> {
		const keywords = PromptAnalyzer.extractKeywords(prompt);
		const aiAnalysis = await PromptAnalyzer.analyzeWithAI(
			env,
			prompt,
			keywords,
		);

		return {
			...aiAnalysis,
			budgetConstraint,
			hasImages: !!attachments?.some((a) => a.type === "image"),
		};
	}
}