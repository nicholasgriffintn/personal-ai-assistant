import { BedrockGuardrailsProvider } from './bedrock';
import type { GuardrailResult } from '../../types';
import { AppError } from '../../utils/errors';

export class Guardrails {
	private static instance: Guardrails;
	private bedrockProvider: BedrockGuardrailsProvider;
	private env: any;

	private constructor(env: any) {
		this.env = env;

		if (!env.BEDROCK_AWS_ACCESS_KEY || !env.BEDROCK_AWS_SECRET_KEY || !env.BEDROCK_GUARDRAIL_ID) {
			throw new AppError('Missing required AWS credentials or guardrail ID', 400);
		}

		this.bedrockProvider = new BedrockGuardrailsProvider({
			guardrailId: env.BEDROCK_GUARDRAIL_ID,
			guardrailVersion: env.BEDROCK_GUARDRAIL_VERSION || 'DRAFT',
			region: env.AWS_REGION || 'us-east-1',
			accessKeyId: env.BEDROCK_AWS_ACCESS_KEY,
			secretAccessKey: env.BEDROCK_AWS_SECRET_KEY,
		});
	}

	public static getInstance(env: any): Guardrails {
		if (!Guardrails.instance) {
			Guardrails.instance = new Guardrails(env);
		}
		return Guardrails.instance;
	}

	async validateInput(message: string): Promise<GuardrailResult> {
		if (this.env.GUARDRAILS_ENABLED === 'false') {
			return { isValid: true, violations: [] };
		}
		return await this.bedrockProvider.validateContent(message, 'INPUT');
	}

	async validateOutput(response: string): Promise<GuardrailResult> {
		if (this.env.GUARDRAILS_ENABLED === 'false') {
			return { isValid: true, violations: [] };
		}
		return await this.bedrockProvider.validateContent(response, 'OUTPUT');
	}
}
