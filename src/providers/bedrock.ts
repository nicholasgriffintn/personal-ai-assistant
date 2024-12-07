import { AwsClient } from 'aws4fetch';
import { AIProvider } from './base';
import { gatewayId } from '../lib/chat';
import { AppError } from '../utils/errors';
import type { AIResponseParams } from '../types';

export class BedrockProvider implements AIProvider {
	name = 'bedrock';

	async getResponse({ model, messages, systemPrompt, env, user }: AIResponseParams) {
		const accessKey = env.BEDROCK_AWS_ACCESS_KEY;
		const secretKey = env.BEDROCK_AWS_SECRET_KEY;

		if (!accessKey || !secretKey || !env.AI_GATEWAY_TOKEN) {
			throw new AppError('Missing AWS_ACCESS_KEY or AWS_SECRET_KEY or AI_GATEWAY_TOKEN');
		}

		const region = 'us-east-1';
		const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${model}/invoke`;

		const body = {
			system: [{ text: systemPrompt }],
			messages,
		};

		const awsClient = new AwsClient({
			accessKeyId: accessKey,
			secretAccessKey: secretKey,
			region,
			service: 'bedrock',
		});

		const presignedRequest = await awsClient.sign(bedrockUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!presignedRequest.url) {
			throw new Error('Failed to get presigned request from Bedrock');
		}

		const signedUrl = new URL(presignedRequest.url);
		signedUrl.host = 'gateway.ai.cloudflare.com';
		signedUrl.pathname = `/v1/${env.ACCOUNT_ID}/${gatewayId}/aws-bedrock/bedrock-runtime/${region}/model/${model}/invoke`;

		const response = await fetch(signedUrl, {
			method: 'POST',
			headers: presignedRequest.headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			console.error(`Failed to get response from Bedrock endpoint`, response);
			throw new Error('Failed to get response from Bedrock');
		}

		const data = (await response.json()) as any;

		if (!data.output.message.content[0].text) {
			throw new Error('No content returned from Bedrock');
		}

		return {
			response: data.output.message.content[0].text,
		};
	}
}
