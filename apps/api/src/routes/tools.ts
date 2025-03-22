import { type Context, Hono } from "hono";
import { describeRoute } from "hono-openapi";

import { availableFunctions } from "~/services/functions";

const app = new Hono();

app.get(
	"/",
	describeRoute({
		tags: ["tools"],
		title: "List Tools",
		description: "Lists the currently available tools.",
	}),
	async (context: Context) => {
		const toolIds = availableFunctions.map((tool) => {
			return {
				id: tool.name,
				name: tool.name,
				description: tool.description,
			};
		});
		return context.json({
			success: true,
			message: "Tools fetched successfully",
			data: toolIds,
		});
	},
);

export default app;
