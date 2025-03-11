export const availableCapabilities = [
	"research",
	"coding",
	"math",
	"creative",
	"analysis",
	"chat",
	"search",
	"multilingual",
	"reasoning",
	"vision",
	"summarization",
	"audio",
] as const;

export const availableModelTypes = [
	"text",
	"coding",
	"speech",
	"image-to-text",
	"image-to-image",
	"text-to-image",
	"embedding",
	"instruct",
	"text-to-video",
	"image-to-video",
	"guardrails",
] as const;

export const defaultModel = "mistral-large";
