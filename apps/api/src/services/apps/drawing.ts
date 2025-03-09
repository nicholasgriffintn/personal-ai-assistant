import { gatewayId } from "../../constants/app";
import { ChatHistory } from "../../lib/history";
import type { ChatRole, IEnv, IFunctionResponse } from "../../types";
import { AssistantError, ErrorType } from "../../utils/errors";
import { StorageService } from "../../lib/storage";
import { drawingDescriptionPrompt } from "../../lib/prompts";

export type ImageFromDrawingRequest = {
	env: IEnv;
	request: {
		drawing?: Blob;
	};
	user: { email: string };
};

interface ImageFromDrawingResponse extends IFunctionResponse {
	completion_id?: string;
}

export const generateImageFromDrawing = async (
	req: ImageFromDrawingRequest,
): Promise<ImageFromDrawingResponse> => {
	const { env, request, user } = req;

	if (!request.drawing) {
		throw new AssistantError("Missing drawing", ErrorType.PARAMS_ERROR);
	}

	const arrayBuffer = await request.drawing.arrayBuffer();
	const length = arrayBuffer.byteLength;

	const drawingId = Math.random().toString(36);
	const drawingImageKey = `drawings/${drawingId}/image.png`;

	let drawingUrl = "";
	try {
		const storageService = new StorageService(env.ASSETS_BUCKET);
		drawingUrl = await storageService.uploadObject(
			drawingImageKey,
			arrayBuffer,
			{
				contentType: "image/png",
				contentLength: length,
			},
		);
	} catch (error) {
		throw new AssistantError("Error uploading drawing");
	}

	const descriptionRequest = await env.AI.run(
		"@cf/llava-hf/llava-1.5-7b-hf",
		{
			prompt: drawingDescriptionPrompt(),
			image: [...new Uint8Array(arrayBuffer)],
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
		},
	);

	const painting = await env.AI.run(
		"@cf/runwayml/stable-diffusion-v1-5-img2img",
		{
			prompt:
				descriptionRequest?.description ||
				"Convert this drawing into a painting.",
			image: [...new Uint8Array(arrayBuffer)],
			guidance: 8,
			strength: 0.85,
			num_inference_steps: 50,
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
		},
	);

	const paintingArrayBuffer = await new Response(painting).arrayBuffer();
	const paintingLength = paintingArrayBuffer.byteLength;

	const paintingImageKey = `drawings/${drawingId}/painting.png`;
	let paintingUrl = "";
	try {
		const storageService = new StorageService(env.ASSETS_BUCKET);
		paintingUrl = await storageService.uploadObject(
			paintingImageKey,
			paintingArrayBuffer,
			{
				contentType: "image/png",
				contentLength: paintingLength,
			},
		);
	} catch (error) {
		throw new AssistantError("Error uploading painting");
	}

	const chatHistory = ChatHistory.getInstance({
		history: env.CHAT_HISTORY,
		store: true,
	});
	await chatHistory.add(drawingId, {
		role: "user",
		content: `Generate a drawing with this prompt: ${descriptionRequest?.description}`,
		app: "drawings",
	});

	const message = {
		role: "assistant" as ChatRole,
		name: "drawing_generate",
		content: descriptionRequest?.description,
		data: {
			drawingUrl,
			paintingUrl,
		},
	};
	const response = await chatHistory.add(drawingId, message);

	return {
		...response,
		completion_id: drawingId,
	};
};
