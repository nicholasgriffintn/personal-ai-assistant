import type { Attachment, ChatRole, IEnv, PromptRequirements } from "../types";
import { AIProviderFactory } from "../providers/factory";
import { AppError } from "../utils/errors";
import { availableFunctions } from "../services/functions";
import { availableCapabilities } from "./models";
import { KeywordFilter } from "./keywords";
import type { AIProvider } from "../providers/base";

// biome-ignore lint/complexity/noStaticOnlyClass: I don't care
export class PromptAnalyzer {
	private static async analyzeWithAI(
		env: IEnv,
		prompt: string,
		keywords: string[],
	): Promise<PromptRequirements> {
		try {
			const provider = AIProviderFactory.getProvider("mistral");

			const analysisResponse = await PromptAnalyzer.performAIAnalysis(
				provider,
				env,
				prompt,
				keywords,
			);

			return PromptAnalyzer.validateAndParseAnalysis(analysisResponse);
		} catch (error) {
			console.error(error);
			throw new AppError(
				`Prompt analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				500,
			);
		}
	}

	private static performAIAnalysis(
		provider: AIProvider,
		env: IEnv,
		prompt: string,
		keywords: string[],
	) {
		return provider.getResponse({
			env,
			model: "open-mistral-nemo",
			messages: [
				{
					role: "system" as ChatRole,
					content: PromptAnalyzer.constructSystemPrompt(keywords),
				},
				{
					role: "user",
					content: prompt,
				},
			],
		});
	}

	private static constructSystemPrompt(keywords: string[]): string {
		return `Analyze the given prompt and return a JSON object with the following properties:
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
      
      Base the analysis on these keywords: ${keywords.join(", ")}`;
	}

	private static validateAndParseAnalysis(analysisResponse: {
		choices: {
			message: {
				content: string;
			};
		}[];
	}): PromptRequirements {
		if (!analysisResponse?.choices?.length) {
			throw new Error("No valid AI response received");
		}

		const content = analysisResponse.choices[0].message.content;
		const requirementsAnalysis = PromptAnalyzer.parseAnalysisContent(content);

		if (
			!requirementsAnalysis.expectedComplexity ||
			!requirementsAnalysis.requiredCapabilities
		) {
			throw new Error("Incomplete or invalid AI analysis");
		}

		return PromptAnalyzer.normalizeRequirements(requirementsAnalysis);
	}

	private static parseAnalysisContent(
		content: string,
	): Partial<PromptRequirements> {
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch && jsonMatch[0].length > 2) {
			return JSON.parse(jsonMatch[0]);
		}
		return PromptAnalyzer.parseMarkdownResponse(content);
	}

	private static normalizeRequirements(
		analysis: Partial<PromptRequirements>,
	): PromptRequirements {
		return {
			expectedComplexity: Math.max(
				1,
				Math.min(5, analysis.expectedComplexity || 1),
			) as 1 | 2 | 3 | 4 | 5,
			requiredCapabilities: analysis.requiredCapabilities || [],
			estimatedInputTokens: Math.max(0, analysis.estimatedInputTokens || 0),
			estimatedOutputTokens: Math.max(0, analysis.estimatedOutputTokens || 0),
			needsFunctions: !!analysis.needsFunctions,
			hasImages: false,
		};
	}

	private static readonly CODING_FILTER = new KeywordFilter(
		KeywordFilter.CODING_KEYWORDS,
	);
	private static readonly MATH_FILTER = new KeywordFilter(
		KeywordFilter.MATH_KEYWORDS,
	);

	private static extractKeywords(prompt: string): string[] {
		const codingKeywords =
			PromptAnalyzer.CODING_FILTER.getMatchedKeywords(prompt);
		const mathKeywords = PromptAnalyzer.MATH_FILTER.getMatchedKeywords(prompt);

		const keywords = [...new Set([...codingKeywords, ...mathKeywords])];

		return keywords.length > 0
			? keywords
			: PromptAnalyzer.fallbackKeywordExtraction(prompt);
	}

	private static fallbackKeywordExtraction(prompt: string): string[] {
		const words = prompt
			.toLowerCase()
			.split(/\W+/)
			.filter(
				(word) =>
					word.length > 2 &&
					(PromptAnalyzer.isPartialMatch(word, KeywordFilter.CODING_KEYWORDS) ||
						PromptAnalyzer.isPartialMatch(word, KeywordFilter.MATH_KEYWORDS)),
			)
			.slice(0, 5);

		return words;
	}

	private static isPartialMatch(
		word: string,
		referenceKeywords: string[],
	): boolean {
		return referenceKeywords.some(
			(keyword) => word.includes(keyword) || keyword.includes(word),
		);
	}

	public static async analyzePrompt(
		env: IEnv,
		prompt: string,
		attachments?: Attachment[],
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

	private static parseMarkdownResponse(
		content: string,
	): Partial<PromptRequirements> {
		const requirements: Partial<PromptRequirements> = {};

		const complexityMatch = content.match(
			/\*\*expectedComplexity\*\*:\s*(\d+)/i,
		);
		if (complexityMatch) {
			const complexity = Number.parseInt(complexityMatch[1]);
			if (complexity >= 1 && complexity <= 5) {
				requirements.expectedComplexity = complexity as 1 | 2 | 3 | 4 | 5;
			}
		}

		const capabilitiesMatch = content.match(
			/\*\*requiredCapabilities\*\*:\s*\[(.*?)\]/i,
		);
		if (capabilitiesMatch) {
			type Capability = (typeof availableCapabilities)[number];

			const capabilities = capabilitiesMatch[1]
				.split(",")
				.map((s) => s.trim().replace(/["\s]/g, ""))
				.filter((cap): cap is Capability =>
					availableCapabilities.includes(cap as Capability),
				);
			requirements.requiredCapabilities = capabilities;
		}

		const inputTokensMatch = content.match(
			/\*\*estimatedInputTokens\*\*:\s*(\d+)/i,
		);
		if (inputTokensMatch) {
			requirements.estimatedInputTokens = Number.parseInt(inputTokensMatch[1]);
		}

		const outputTokensMatch = content.match(
			/\*\*estimatedOutputTokens\*\*:\s*(\d+)/i,
		);
		if (outputTokensMatch) {
			requirements.estimatedOutputTokens = Number.parseInt(
				outputTokensMatch[1],
			);
		}

		const needsFunctionsMatch = content.match(
			/\*\*needsFunctions\*\*:\s*(true|false)/i,
		);
		if (needsFunctionsMatch) {
			requirements.needsFunctions =
				needsFunctionsMatch[1].toLowerCase() === "true";
		}

		return requirements;
	}
}
