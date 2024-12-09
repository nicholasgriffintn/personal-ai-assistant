import type { IEnv, Model, PromptRequirements } from "../types";
import { modelCapabilities, defaultModel } from "./models";
import { PromptAnalyzer } from "./promptAnalyser";

interface ModelScore {
	model: Model;
	score: number;
	reason: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: i want to use this class as a static class
export class ModelRouter {
	private static scoreModel(
		requirements: PromptRequirements,
		model: Model,
	): ModelScore {
		const capabilities = modelCapabilities[model];
		let score = 0;

		const capabilityMatch = requirements.requiredCapabilities.every((cap) =>
			capabilities.strengths.includes(cap),
		);
		if (!capabilityMatch) {
			return { model, score: 0, reason: "Missing required capabilities" };
		}

		score +=
			Math.max(
				0,
				5 -
					Math.abs(
						requirements.expectedComplexity - capabilities.contextComplexity,
					),
			) * 2;

		if (requirements.budgetConstraint) {
			const estimatedInputCost =
				(requirements.estimatedInputTokens / 1000) *
				capabilities.costPer1kInputTokens;
			const estimatedOutputCost =
				(requirements.estimatedOutputTokens / 1000) *
				capabilities.costPer1kOutputTokens;
			const totalCost = estimatedInputCost + estimatedOutputCost;

			if (totalCost > requirements.budgetConstraint) {
				return { model, score: 0, reason: "Over budget" };
			}
			score += (1 - totalCost / requirements.budgetConstraint) * 3;
		}

		score += capabilities.reliability;
		score += 6 - capabilities.speed;

		if (requirements.hasImages && capabilities.multimodal) {
			score += 5;
		}

		if (requirements.needsFunctions && capabilities.supportsFunctions) {
			score += 5;
		}

		return { model, score, reason: "Matched requirements" };
	}

	public static async selectModel(
		env: IEnv,
		prompt: string,
		attachments?: any[],
		budgetConstraint?: number,
	): Promise<Model> {
		try {
			const requirements = await PromptAnalyzer.analyzePrompt(
				env,
				prompt,
				attachments,
				budgetConstraint,
			);

			const modelScores: ModelScore[] = Object.keys(modelCapabilities)
				.map((model) => ModelRouter.scoreModel(requirements, model as Model))
				.sort((a, b) => b.score - a.score);

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
		} catch (error) {
			console.error("Error in model selection:", error);
			return defaultModel;
		}
	}
}

