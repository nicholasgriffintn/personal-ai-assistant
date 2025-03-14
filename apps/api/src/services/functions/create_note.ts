import type { IFunction, IRequest } from "../../types";
import { insertEmbedding } from "../apps/embeddings/insert";

export const create_note: IFunction = {
	name: "create_note",
	description:
		"Create a note with a title and content, only use this if the user has explicitly asked to save something",
	parameters: {
		type: "object",
		properties: {
			title: {
				type: "string",
				description:
					"The title of the note, this can be a summary of the content",
			},
			content: {
				type: "string",
				description: "The content of the note",
			},
			metadata: {
				type: "object",
				description: "Metadata about the note",
			},
		},
		required: ["title", "content"],
	},
	function: async (
		completion_id: string,
		args: any,
		req: IRequest,
		app_url?: string,
	) => {
		if (!args.title || !args.content) {
			return {
				status: "error",
				name: "create_note",
				content: "Missing title or content",
				data: {},
			};
		}

		const response = await insertEmbedding({
			request: {
				type: "note",
				...args,
			},
			env: req.env,
		});

		if (!response.data) {
			return {
				status: "error",
				name: "create_note",
				content: "Error creating note",
				data: {},
			};
		}

		return {
			status: "success",
			name: "create_note",
			content: "Note created successfully",
			data: response.data,
		};
	},
};
