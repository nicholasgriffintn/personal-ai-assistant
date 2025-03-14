import type { IEnv } from "../types";
import { StorageService } from "./storage";

export async function uploadImageFromChat(
	modelResponse: ReadableStream | string,
	env: IEnv,
	imageKey: string,
) {
	let arrayBuffer: ArrayBuffer;

	if (modelResponse instanceof ReadableStream) {
		const reader = modelResponse.getReader();
		const chunks = [];
		let uploadDone = false;

		while (!uploadDone) {
			const { done, value } = await reader.read();
			if (value) {
				chunks.push(value);
			}
			uploadDone = true;
		}
		arrayBuffer = new Uint8Array(
			chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), []),
		).buffer;
	} else {
		const base64Data = modelResponse.replace(/^data:image\/\w+;base64,/, "");
		const binaryString = atob(base64Data);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		arrayBuffer = bytes.buffer;
	}

	const length = arrayBuffer.byteLength;

	const storageService = new StorageService(env.ASSETS_BUCKET);
	const response = await storageService.uploadObject(imageKey, arrayBuffer, {
		contentType: "image/png",
		contentLength: length,
	});

	return response;
}
