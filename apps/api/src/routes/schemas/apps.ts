import { z } from "zod";

export const insertEmbeddingSchema = z.object({
	type: z.string(),
	content: z.string(),
	id: z.string().optional(),
	metadata: z.record(z.any()).optional(),
	title: z.string().optional(),
	ragOptions: z.object({
		namespace: z.string().optional(),
	}),
});

export const queryEmbeddingsSchema = z.object({
	query: z.string(),
	namespace: z.string().optional(),
});

export const deleteEmbeddingSchema = z.object({
	ids: z.array(z.string()),
});

export const weatherQuerySchema = z.object({
	longitude: z.string().transform((val) => Number.parseFloat(val)),
	latitude: z.string().transform((val) => Number.parseFloat(val)),
});

export const imageGenerationSchema = z.object({
	prompt: z.string(),
	negative_prompt: z.string().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	num_outputs: z.number().optional(),
	guidance_scale: z.number().optional(),
});

export const videoGenerationSchema = z.object({
	prompt: z.string(),
	negative_prompt: z.string().optional(),
	guidance_scale: z.number().optional(),
	video_length: z.number().optional(),
	height: z.number().optional(),
	width: z.number().optional(),
});

export const musicGenerationSchema = z.object({
	prompt: z.string(),
	input_audio: z.string().optional(),
	duration: z.number().optional(),
});

export const drawingSchema = z.object({
	drawing: z.any(),
});

export const guessDrawingSchema = z.object({
	drawing: z.any(),
});

export const podcastUploadSchema = z.object({
	audioUrl: z.string().url().optional(),
});

export const podcastTranscribeSchema = z.object({
	podcastId: z.string(),
	numberOfSpeakers: z.number(),
	prompt: z.string(),
});

export const podcastSummarizeSchema = z.object({
	podcastId: z.string(),
	speakers: z.record(z.string()),
});

export const podcastGenerateImageSchema = z.object({
	podcastId: z.string(),
});

export const articleAnalyzeSchema = z.object({
	article: z.string(),
});

export const articleSummariseSchema = z.object({
	article: z.string(),
});

export const generateArticlesReportSchema = z.object({
	articles: z.string(),
});

export const textToSpeechSchema = z.object({
	content: z.string(),
});

export const webSearchSchema = z.object({
	query: z.string(),
	search_depth: z.enum(["basic", "advanced"]).optional(),
	include_answer: z.boolean().optional(),
	include_raw_content: z.boolean().optional(),
	include_images: z.boolean().optional(),
});

export const contentExtractSchema = z.object({
	urls: z.array(z.string().url()),
	extract_depth: z.enum(["basic", "advanced"]).optional(),
	include_images: z.boolean().optional(),
	should_vectorize: z.boolean().optional(),
	namespace: z.string().optional(),
});

export const captureScreenshotSchema = z.object({
	url: z.string().optional(),
	html: z.string().optional(),
	screenshotOptions: z.object({
		omitBackground: z.boolean().optional(),
		fullPage: z.boolean().optional(),
	}).optional(),
	viewport: z.object({
		width: z.number().optional(),
		height: z.number().optional(),
	}).optional(),
	gotoOptions: z.object({
		waitUntil: z.enum(["domcontentloaded", "networkidle0"]).optional(),
		timeout: z.number().optional(),
	}).optional(),
	addScriptTag: z.array(z.object({
		url: z.string().optional(),
		content: z.string().optional(),
	})).optional(),
	addStyleTag: z.array(z.object({
		url: z.string().optional(),
		content: z.string().optional(),
	})).optional(),
});
