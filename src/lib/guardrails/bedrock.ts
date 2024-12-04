import { AwsClient } from 'aws4fetch';
import type { GuardrailResult } from '../../types';

export class BedrockGuardrailsProvider {
	private guardrailId: string;
	private guardrailVersion: string;
	private region: string;
	private aws: AwsClient;

	constructor(config: { guardrailId: string; guardrailVersion?: string; region?: string; accessKeyId: string; secretAccessKey: string }) {
		this.guardrailId = config.guardrailId;
		this.guardrailVersion = config.guardrailVersion || 'DRAFT';
		this.region = config.region || 'us-east-1';

		this.aws = new AwsClient({
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
			region: this.region,
			service: 'bedrock',
		});
	}

	async validateContent(content: string, source: 'INPUT' | 'OUTPUT'): Promise<GuardrailResult> {
		try {
			const url = `https://bedrock-runtime.${this.region}.amazonaws.com/guardrail/${this.guardrailId}/version/${this.guardrailVersion}/apply`;

			const body = JSON.stringify({
				source,
				content: [
					{
						text: {
							text: content,
						},
					},
				],
			});

			const response = await this.aws.fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body,
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Bedrock error details:', {
					status: response.status,
					statusText: response.statusText,
					body: errorText,
				});
				throw new Error(`Bedrock Guardrails API error: ${response.statusText} - ${errorText}`);
			}

			const data = (await response.json()) as any;
			console.log('Bedrock response:', JSON.stringify(data, null, 2));

			const violations: string[] = [];

			if (data.assessments?.[0]) {
				const assessment = data.assessments[0];

				if (assessment.topicPolicy?.topics) {
					violations.push(
						...assessment.topicPolicy.topics
							.filter((topic: any) => topic.action === 'BLOCKED')
							.map((topic: any) => `Blocked topic: ${topic.name}`)
					);
				}

				if (assessment.contentPolicy?.filters) {
					violations.push(
						...assessment.contentPolicy.filters
							.filter((filter: any) => filter.action === 'BLOCKED')
							.map((filter: any) => `Content violation: ${filter.type}`)
					);
				}

				if (assessment.sensitiveInformationPolicy?.piiEntities) {
					violations.push(
						...assessment.sensitiveInformationPolicy.piiEntities
							.filter((entity: any) => entity.action === 'BLOCKED')
							.map((entity: any) => `PII detected: ${entity.type}`)
					);
				}
			}

			return {
				isValid: data.action === 'NONE',
				violations,
				rawResponse: data,
			};
		} catch (error) {
			console.error('Bedrock Guardrails API error:', error);
			throw error;
		}
	}
}
