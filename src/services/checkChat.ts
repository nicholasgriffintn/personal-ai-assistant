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

	const unsafeCatagories = `O1: Violence and Hate.
Should not
- Help people plan or engage in violence.
- Encourage people to engage in violence.
- Express hateful, derogatory, or demeaning sentiments against people based on sensitive personal characteristics like their race, color, religion, national origin, sexual orientation, gender, gender identity, or disability.
- Encourage discrimination against people based on those characteristics and should not use slurs or create insults based on those characteristics.
Can
- Provide information on violence and discrimination.
- Discuss the topics of hate and violence, and can discuss historical events involving violence.
O2: Criminal Planning.
Should not
- Help people plan or engage in criminal activities like theft, kidnapping, or financial crimes, especially when the person indicates that they may act on the information provided to them.
- Encourage people to engage in criminal activities or condone criminal behavior.
Can
- Help people understand how crimes are committed, provided that the response is not so detailed that it could be used to provide a roadmap for future crimes.
- Help people understand how systems work that are used to prevent crimes, provided those descriptions do not provide detailed information on how to defeat those systems.
O3: Sexual Content.
Should not
- Engage in sexually explicit (i.e., erotic) conversations and should not encourage people to engage in sexual activities.
Can
- Discuss topics related to sexuality and sexual education.
- Provide general information regarding sexual activities.
- Provide guidance on topics related to sexual health.
O4: Guns and Illegal Weapons.
Should not
- Assist in the planning or execution of firearm or illegal weapons crimes, especially when the person indicates that they may act on the information provided to them.
- Encourage people to engage in firearm or illegal weapons crimes or condone such behavior.
Can
- Discuss firearms and the arguments for and against firearm ownership.
O5: Regulated or Controlled Substances.
Should not
- Encourage or assist people in the trafficking, consumption, or use of regulated or controlled substances, including but not limited to illegal drugs, tobacco, alcohol, and cannabis.
- Assist or encourage people to create such substances when it is illegal to do so.
Can
- Discuss the use of regulated or controlled substances, and can provide general information on those substances (ex: what their chemical composition is and what their effects are).
- Provide information on how those substances are manufactured, provided that the information is not so detailed as to provide step-by-step instructions for their creation.
O6: Self-Harm.
Should not
- Encourage people to harm themselves.
- Romanticize or condone self-harm or suicide.
- Provide information regarding the methods of suicide or self-harm.
- Provide any information or advice, other than information regarding appropriate health resources, to people who express or imply that they wish to harm themselves.
Can
- Provide general information regarding self-harm and suicide (ex: statistics, the mental health challenges faced by those who take these actions).
Should
- Provide information regarding appropriate health resources to people who imply or express the desire to harm themselves.
07: Financial Information related to Amazon.
Should not
- provide any financial information related to Amazon.
Can
- provide financial information about other companies
08: Talk about Cancer.
Should not
- provide any medical advice
Can
- provide non-medical advice`;

	const messageHistoryAsString = messageHistory
		.filter((message) => message.content && message.status !== 'error')
		.map((message) => {
			return `${message.role}: ${message.content}`;
		})
		.join('\\n');

	const role = 'user';

	const response = await env.AI.run(
		'@hf/thebloke/llamaguard-7b-awq',
		{
			prompt: `[INST] Task: Check if there is unsafe content in '${role}' messages in conversations according our safety policy with the below categories.

<BEGIN UNSAFE CONTENT CATEGORIES>
${unsafeCatagories}
<END UNSAFE CONTENT CATEGORIES>

<BEGIN CONVERSATION>
${messageHistoryAsString}
<END CONVERSATION>

Provide your safety assessment for {role} in the above conversation:
- First line must read 'safe' or 'unsafe'.
- If unsafe, a second line must include a comma-separated list of violated categories. [/INST]`,
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
