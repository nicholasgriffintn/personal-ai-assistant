import type { IRequest, IFunctionResponse } from '../types';
import { ChatHistory } from '../lib/history';
import { gatewayId } from '../lib/chat';

export const handleCheckChat = async (req: IRequest): Promise<IFunctionResponse | IFunctionResponse[]> => {
	const { request, env, user } = req;

	if (!env.AI) {
		throw new Error('Missing AI binding');
	}

	if (!env.CHAT_HISTORY) {
		return {
			status: 'error',
			content: 'Missing chat history',
		};
	}

	if (!request) {
		return {
			status: 'error',
			content: 'Missing request',
		};
	}

	const chatHistory = ChatHistory.getInstance(env.CHAT_HISTORY);
	const messageHistory = await chatHistory.get(request.chat_id);

	if (!messageHistory?.length) {
		return {
			status: 'error',
			content: 'No messages found',
		};
	}

	const response = await env.AI.run(
		'@hf/thebloke/llamaguard-7b-awq',
		{
			prompt: `You are an advanced content moderation system designed to analyze conversations for unsafe content across multiple categories. Your task is to carefully review the following conversation and determine if it contains any unsafe content according to our safety policy.

Here is the conversation you need to analyze:

<conversation>
${messageHistory
	.filter((message) => message.content && message.status !== 'error')
	.map((message) => {
		return `${message.role}: ${message.content}`;
	})
	.join('\\n')}
</conversation>

You are an advanced content moderation system designed to analyze conversations for unsafe content across multiple categories. Your task is to carefully review the above conversation and determine if it contains any unsafe content according to our safety policy.

Before providing your final assessment, please conduct a thorough analysis of the conversation. Use the following categories as a guide:

<safety_categories>
1. Violence and Hate
2. Sexual Content
3. Criminal Planning
4. Guns and Illegal Weapons
5. Regulated or Controlled Substances
6. Self-Harm
</safety_categories>

For each category, consider the following guidelines:

1. Violence and Hate:
   - Do not condone: Planning or engaging in violence, encouraging violence, expressing hateful sentiments based on personal characteristics, encouraging discrimination, or using slurs.
   - Can discuss: Information on violence and discrimination, topics of hate and violence, historical events involving violence.

2. Sexual Content:
   - Do not engage in: Sexually explicit conversations, encouraging sexual activities.
   - Can discuss: Topics related to sexuality and sexual education, general information on sexual activities, guidance on sexual health.

3. Criminal Planning:
   - Do not assist with: Planning criminal activities, encouraging criminal behavior.
   - Can discuss: How crimes are committed (without detailed instructions), how crime prevention systems work (without compromising details).

4. Guns and Illegal Weapons:
   - Do not assist with: Planning firearm or illegal weapons crimes, encouraging such behavior.
   - Can discuss: Firearms and arguments for/against firearm ownership.

5. Regulated or Controlled Substances:
   - Do not encourage: Trafficking, consumption, or illegal creation of controlled substances.
   - Can discuss: General information about these substances, including composition and effects, and manufacturing processes (without detailed instructions).

6. Self-Harm:
   - Do not: Encourage self-harm, romanticize suicide, provide methods for self-harm or suicide.
   - Should: Provide information on appropriate health resources if self-harm is mentioned.
   - Can discuss: General information and statistics on self-harm and suicide.

Please analyze the conversation thoroughly, considering all aspects of these categories. In your analysis, be sure to:
1. Check for both explicit and implicit unsafe content.
2. Consider the context of the conversation.
3. Evaluate the intent behind the messages.
4. Assess the potential harm that could result from the content.

Conduct your safety assessment inside <safety_assessment> tags. In your assessment:

1. For each safety category:
   - Quote any relevant parts of the conversation.
   - Explicitly state whether the category is violated or not, with a brief explanation.
2. Count the total number of violations.

It's OK for this section to be quite long.

After your assessment, provide your final safety determination in the following format:
- First line: 'safe' or 'unsafe'
- If unsafe, include a second line with a comma-separated list of all violated categories

Example output:
unsafe
Violence and Hate, Criminal Planning

Remember, it's crucial to be thorough in your assessment to ensure the safety of all users. If you're unsure about a particular piece of content, err on the side of caution and mark it as unsafe.`,
		},
		{
			gateway: {
				id: gatewayId,
				skipCache: false,
				cacheTtl: 3360,
				metadata: {
					email: user?.email,
				},
			},
		}
	);

	if (!response.response) {
		return {
			status: 'error',
			content: 'No response from the model',
		};
	}

	return {
		status: 'success',
		content: response.response,
	};
};
