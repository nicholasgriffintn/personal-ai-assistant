import type {
	Attachment,
	IEnv,
	Model,
	ModelCapabilities,
	PromptRequirements,
} from "../types";
import { modelCapabilities, defaultModel } from "./models";
import { PromptAnalyzer } from "./promptAnalyser";

interface ModelScore {
	model: Model;
	score: number;
	reason: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: i want to use this class as a static class
export class ModelRouter {
	private static readonly WEIGHTS = {
		COMPLEXITY_MATCH: 2,
		BUDGET_EFFICIENCY: 3,
		RELIABILITY: 1,
		SPEED: 1,
		MULTIMODAL: 5,
		FUNCTIONS: 5,
	} as const;

	private static scoreModel(
		requirements: PromptRequirements,
		model: Model,
	): ModelScore {
		const capabilities = modelCapabilities[model];

		// Early returns for basic requirements
		if (requirements.requiredCapabilities.length === 0) {
			return { model, score: 0, reason: "No required capabilities" };
		}

		if (!ModelRouter.hasRequiredCapabilities(requirements, capabilities)) {
			return { model, score: 0, reason: "Missing required capabilities" };
		}

		if (!ModelRouter.isWithinBudget(requirements, capabilities)) {
			return { model, score: 0, reason: "Over budget" };
		}

		// Calculate composite score
		const score = ModelRouter.calculateScore(requirements, capabilities);

		return {
			model,
			score,
			reason: "Matched requirements",
		};
	}

	private static hasRequiredCapabilities(
		requirements: PromptRequirements,
		capabilities: ModelCapabilities,
	): boolean {
		return requirements.requiredCapabilities.every((cap) =>
			capabilities.strengths.includes(cap),
		);
	}

	private static isWithinBudget(
		requirements: PromptRequirements,
		capabilities: ModelCapabilities,
	): boolean {
		if (!requirements.budgetConstraint) return true;

		const totalCost = ModelRouter.calculateTotalCost(
			requirements,
			capabilities,
		);
		return totalCost <= requirements.budgetConstraint;
	}

	private static calculateTotalCost(
		requirements: PromptRequirements,
		capabilities: ModelCapabilities,
	): number {
		const estimatedInputCost =
			(requirements.estimatedInputTokens / 1000) *
			capabilities.costPer1kInputTokens;
		const estimatedOutputCost =
			(requirements.estimatedOutputTokens / 1000) *
			capabilities.costPer1kOutputTokens;

		return estimatedInputCost + estimatedOutputCost;
	}

	private static calculateScore(
		requirements: PromptRequirements,
		capabilities: ModelCapabilities,
	): number {
		let score = 0;

		// Complexity match score
		score +=
			Math.max(
				0,
				5 -
					Math.abs(
						requirements.expectedComplexity - capabilities.contextComplexity,
					),
			) * ModelRouter.WEIGHTS.COMPLEXITY_MATCH;

		// Budget efficiency score
		if (requirements.budgetConstraint) {
			const totalCost = ModelRouter.calculateTotalCost(
				requirements,
				capabilities,
			);
			score +=
				(1 - totalCost / requirements.budgetConstraint) *
				ModelRouter.WEIGHTS.BUDGET_EFFICIENCY;
		}

		// Base capability scores
		score += capabilities.reliability * ModelRouter.WEIGHTS.RELIABILITY;
		score += (6 - capabilities.speed) * ModelRouter.WEIGHTS.SPEED;

		// Special capability scores
		if (requirements.hasImages && capabilities.multimodal) {
			score += ModelRouter.WEIGHTS.MULTIMODAL;
		}

		if (requirements.needsFunctions && capabilities.supportsFunctions) {
			score += ModelRouter.WEIGHTS.FUNCTIONS;
		}

		return score;
	}

	public static async selectModel(
		env: IEnv,
		prompt: string,
		attachments?: Attachment[],
		budgetConstraint?: number,
	): Promise<Model> {
		try {
			const requirements = await PromptAnalyzer.analyzePrompt(
				env,
				prompt,
				attachments,
				budgetConstraint,
			);

			const modelScores = ModelRouter.rankModels(requirements);
			return ModelRouter.selectBestModel(modelScores);
		} catch (error) {
			console.error("Error in model selection:", error);
			return defaultModel;
		}
	}

	private static rankModels(requirements: PromptRequirements): ModelScore[] {
		return Object.keys(modelCapabilities)
			.map((model) => ModelRouter.scoreModel(requirements, model as Model))
			.sort((a, b) => b.score - a.score);
	}

	private static selectBestModel(modelScores: ModelScore[]): Model {
		if (modelScores[0].score === 0) {
			console.warn("No suitable model found. Falling back to default model.");
			return defaultModel;
		}

		console.log(
			"Selected model:",
			modelScores[0].model,
			"with score:",
			modelScores[0].score,
		);
		return modelScores[0].model;
	}
}
