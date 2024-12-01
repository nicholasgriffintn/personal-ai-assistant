import type { IEnv, IFunctionResponse } from '../../types';
import { gatewayId } from '../../lib/chat';

export type ImageFromDrawingRequest = {
	env: IEnv;
	request: {
		drawing?: Blob;
	};
	user: { email: string };
};

interface ImageFromDrawingResponse extends IFunctionResponse {
	chatId?: string;
}

export const generateImageFromDrawing = async (req: ImageFromDrawingRequest): Promise<ImageFromDrawingResponse> => {
	try {
		const { env, request, user } = req;

		if (!request.drawing) {
			return {
				status: 'error',
				content: 'Missing drawing',
			};
		}

		const arrayBuffer = await request.drawing.arrayBuffer();
		const length = arrayBuffer.byteLength;

		const drawingId = Math.random().toString(36);
		const drawingImageKey = `drawings/${drawingId}/image.png`;

		const drawingUrl = await env.ASSETS_BUCKET.put(drawingImageKey, arrayBuffer, {
			contentType: 'audio/mp3',
			contentLength: length,
		});

		const descriptionRequest = await env.AI.run(
			'@cf/llava-hf/llava-1.5-7b-hf',
			{
				prompt: 'Describe this drawing in a single sentence.',
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
			}
		);

		const painting = await env.AI.run(
			'@cf/runwayml/stable-diffusion-v1-5-img2img',
			{
				prompt: descriptionRequest?.description || 'Convert this drawing into a painting.',
				image: [...new Uint8Array(arrayBuffer)],
				guidance: 8,
				strength: 0.75,
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

		const paintingArrayBuffer = painting;

		const paintingImageKey = `drawings/${drawingId}/painting.png`;
		const imageUrl = await env.ASSETS_BUCKET.put(paintingImageKey, paintingArrayBuffer, {
			contentType: 'audio/mp3',
			contentLength: length,
		});

		return {
			status: 'success',
			content: descriptionRequest?.description,
			data: {
				drawingUrl,
				imageUrl,
			},
		};
	} catch (error) {
		console.error(error);
		return {
			status: 'error',
			content: 'Error generating image from drawing',
		};
	}
};
