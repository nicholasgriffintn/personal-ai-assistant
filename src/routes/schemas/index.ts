import z from "zod";

import "zod-openapi/extend";

export const statusResponseSchema = z.object({
	status: z.string().openapi({ example: "ok" }),
});
