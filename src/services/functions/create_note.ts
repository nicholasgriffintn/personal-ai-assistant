import { IFunction, IRequest } from '../../types';
import { insertEmbedding } from '../apps/insert-embedding';

export const create_note: IFunction = {
	name: 'create_note',
	description: 'Create a note with a title and content',
	parameters: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				description: 'The title of the note, this can be a summary of the content',
			},
			content: {
				type: 'string',
				description: 'The content of the note',
			},
			metadata: {
				type: 'object',
				description: 'Metadata about the note',
			},
		},
		required: ['id', 'content'],
	},
	function: async (chatId: string, args: any, req: IRequest, appUrl?: string) => {
		if (!args.id || !args.content) {
			return {
				status: 'error',
				name: 'create_note',
				content: 'Missing title or content',
				data: {},
			};
		}

		const data = await insertEmbedding({
			request: {
				type: 'note',
				...args,
			},
			env: req.env,
		});

		return data;
	},
};
