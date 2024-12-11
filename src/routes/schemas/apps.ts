import { z } from "zod";

export const insertEmbeddingSchema = z.object({
	content: z.string(),
	metadata: z.record(z.any()).optional(),
	type: z.string().optional(),
});

export const queryEmbeddingsSchema = z.object({
	query: z.string(),
});

export const weatherQuerySchema = z.object({
	longitude: z.string().transform((val) => Number.parseFloat(val)),
	latitude: z.string().transform((val) => Number.parseFloat(val)),
});

export const imageGenerationSchema = z.object({
	prompt: z.string(),
	model: z.string().optional(),
	negative_prompt: z.string().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	steps: z.number().optional(),
	seed: z.number().optional(),
	num_outputs: z.number().optional(),
});

export const videoGenerationSchema = z.object({
	prompt: z.string(),
	model: z.string().optional(),
	negative_prompt: z.string().optional(),
	num_frames: z.number().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	fps: z.number().optional(),
	seed: z.number().optional(),
});

export const musicGenerationSchema = z.object({
	prompt: z.string(),
	model: z.string().optional(),
	duration: z.number().optional(),
});

export const drawingSchema = z.object({
	image: z.instanceof(Blob),
	prompt: z.string().optional(),
});

export const guessDrawingSchema = z.object({
	image: z.instanceof(Blob),
});

export const podcastUploadSchema = z.object({
	url: z.string().url(),
	title: z.string(),
	description: z.string().optional(),
});

export const podcastTranscribeSchema = z.object({
	id: z.string(),
	url: z.string().url(),
});

export const podcastSummarizeSchema = z.object({
	id: z.string(),
	transcript: z.string(),
});

export const podcastGenerateImageSchema = z.object({
	id: z.string(),
	summary: z.string(),
});
