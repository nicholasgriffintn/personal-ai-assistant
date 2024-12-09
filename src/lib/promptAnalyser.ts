import type { Attachment, ChatRole, IEnv, PromptRequirements } from "../types";
import { AIProviderFactory } from "../providers/factory";
import { AppError } from "../utils/errors";
import { availableFunctions } from "../services/functions";
import { availableCapabilities } from "./models";

// biome-ignore lint/complexity/noStaticOnlyClass: I don't care
export class PromptAnalyzer {
	private static async analyzeWithAI(
		env: IEnv,
		prompt: string,
		keywords: string[],
	): Promise<PromptRequirements> {
		const provider = AIProviderFactory.getProvider("mistral");

		const analysis = await provider.getResponse({
			env,
			model: "open-mistral-nemo",
			messages: [
				{
					role: "system" as ChatRole,
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

		const content = analysis.choices[0].message.content;
		let requirementsAnalysis: Partial<PromptRequirements>;

		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch && jsonMatch[0].length > 2) {
			const cleanedJson = jsonMatch[0].replace(/(\d+)-(\d+)/g, "$2");
			try {
				requirementsAnalysis = JSON.parse(cleanedJson);
			} catch (e) {
				requirementsAnalysis = PromptAnalyzer.parseMarkdownResponse(content);
			}
		} else {
			requirementsAnalysis = PromptAnalyzer.parseMarkdownResponse(content);
		}

		console.log("content", content);
		console.log("Parsed requirements:", requirementsAnalysis);

		if (
			!requirementsAnalysis.expectedComplexity ||
			!requirementsAnalysis.requiredCapabilities
		) {
			throw new AppError("Invalid AI response format", 500);
		}

		const requirements: PromptRequirements = {
			expectedComplexity: requirementsAnalysis.expectedComplexity || 1,
			requiredCapabilities: requirementsAnalysis.requiredCapabilities || [],
			estimatedInputTokens: requirementsAnalysis.estimatedInputTokens || 0,
			estimatedOutputTokens: requirementsAnalysis.estimatedOutputTokens || 0,
			needsFunctions: requirementsAnalysis.needsFunctions || false,
			hasImages: false,
		};

		requirements.expectedComplexity = Math.max(
			1,
			Math.min(5, requirements.expectedComplexity),
		) as 1 | 2 | 3 | 4 | 5;
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