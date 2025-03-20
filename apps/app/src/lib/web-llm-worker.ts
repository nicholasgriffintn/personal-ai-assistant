import type * as webllmTypes from "@mlc-ai/web-llm";

self.onmessage = async (e: MessageEvent) => {
	console.debug("[WebLLMWorker] Received message:", e.data);
	const { action, payload } = e.data;

	try {
		switch (action) {
			case "init": {
				const { model, progressId } = payload;
				console.debug(`[WebLLMWorker] Initializing model: ${model}`);

				self.postMessage({
					type: "progress",
					progressId,
					progress: 0.01,
					text: `Starting initialization for ${model}...`,
				});

				await initModel(model, progressId);
				console.debug(`[WebLLMWorker] Model ${model} initialized successfully`);
				self.postMessage({ type: "init_complete", model });
				break;
			}

			case "generate": {
				const { selectedChat, prompt, model } = payload;
				console.debug(
					`[WebLLMWorker] Generating text for chat ${selectedChat}`,
				);
				const result = await generateText(selectedChat, prompt, model);
				console.debug(
					`[WebLLMWorker] Text generation complete, length: ${result.length}`,
				);
				self.postMessage({ type: "generation_complete", result });
				break;
			}

			case "reset": {
				console.debug("[WebLLMWorker] Resetting chat");
				await resetChat();
				console.debug("[WebLLMWorker] Chat reset complete");
				self.postMessage({ type: "reset_complete" });
				break;
			}

			case "unload": {
				console.debug("[WebLLMWorker] Unloading model");
				await unloadModel();
				console.debug("[WebLLMWorker] Model unloaded successfully");
				self.postMessage({ type: "unload_complete" });
				break;
			}
		}
	} catch (error) {
		console.error("[WebLLMWorker] Error:", error);
		self.postMessage({
			type: "error",
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

let webllmModule: typeof import("@mlc-ai/web-llm") | null = null;
let engine: any | null = null;
let isInitialized = false;
let chatHistory: any[] = [];
let currentModel: string | null = null;

async function loadWebLLM() {
	console.debug("[WebLLMWorker] Loading WebLLM module");
	if (!webllmModule) {
		webllmModule = await import("@mlc-ai/web-llm");
	}
	return webllmModule;
}

async function initModel(model: string, progressId?: string): Promise<void> {
	console.debug(
		`[WebLLMWorker] initModel called for ${model}, current state: initialized=${isInitialized}, currentModel=${currentModel}`,
	);

	if (!isInitialized || currentModel !== model) {
		if (engine) {
			console.debug(
				`[WebLLMWorker] Unloading existing model ${currentModel} before loading ${model}`,
			);
			await unloadModel();
		}

		console.debug("[WebLLMWorker] Loading WebLLM module");
		const webllmInstance = await loadWebLLM();

		if (progressId) {
			self.postMessage({
				type: "progress",
				progressId,
				progress: 0.1,
				text: `WebLLM module loaded, creating engine for ${model}...`,
			});
		}

		console.debug(`[WebLLMWorker] Creating MLC Engine for ${model}`);
		engine = await webllmInstance.CreateMLCEngine(model, {
			initProgressCallback: (progress) => {
				console.debug(
					`[WebLLMWorker] Model initialization progress: ${Math.round(progress.progress * 100)}%, ${progress.text}`,
				);

				if (progressId) {
					self.postMessage({
						type: "progress",
						progressId,
						progress: progress.progress,
						text: progress.text,
					});
				}
			},
		});

		console.debug(`[WebLLMWorker] Engine created successfully for ${model}`);
		isInitialized = true;
		currentModel = model;

		if (progressId) {
			self.postMessage({
				type: "progress",
				progressId,
				progress: 1.0,
				text: `Model ${model} loaded successfully`,
			});
		}
	} else {
		console.debug(
			`[WebLLMWorker] Model ${model} already initialized, skipping`,
		);
	}
}

async function generateText(
	selectedChat: string,
	prompt: string,
	model: string,
): Promise<string> {
	if (!engine || !currentModel) {
		throw new Error("Engine or model not initialized");
	}

	console.debug(
		`[WebLLMWorker] Generating text for chat ${selectedChat}, prompt length: ${prompt.length}`,
	);

	self.postMessage({
		type: "user_message_received",
		selectedChat,
		content: prompt,
		model,
	});

	chatHistory.push({ role: "user", content: prompt });

	const request: webllmTypes.ChatCompletionRequest = {
		messages: chatHistory,
		stream: true,
	};

	let generatedContent = "";
	console.debug("[WebLLMWorker] Creating completion");
	const asyncChunkGenerator = await engine.chat.completions.create(request);

	let hasCompleted = false;
	let chunkCount = 0;
	console.debug("[WebLLMWorker] Starting to process chunks");

	for await (const chunk of asyncChunkGenerator) {
		chunkCount++;
		const delta = chunk.choices[0]?.delta?.content || "";
		if (delta) {
			generatedContent += delta;

			if (chunkCount % 10 === 0) {
				console.debug(
					`[WebLLMWorker] Generated ${generatedContent.length} characters so far (${chunkCount} chunks)`,
				);
			}

			self.postMessage({
				type: "progress_text",
				delta,
				selectedChat,
				model,
			});
		}

		if (chunk.choices[0]?.finish_reason === "stop") {
			hasCompleted = true;
			console.debug("[WebLLMWorker] Generation complete, reason: stop");
		}
	}

	chatHistory.push({
		role: "assistant",
		content: generatedContent,
	});

	console.debug(
		`[WebLLMWorker] Text generation complete. Generated ${generatedContent.length} characters in ${chunkCount} chunks.`,
	);

	if (hasCompleted) {
		self.postMessage({
			type: "assistant_message_complete",
			selectedChat,
			content: generatedContent,
			model,
		});
	}

	return generatedContent;
}

async function resetChat(): Promise<void> {
	if (!engine) {
		throw new Error("Engine not initialized");
	}
	console.debug("[WebLLMWorker] Resetting chat");
	await engine.resetChat();
	chatHistory = [];
	console.debug("[WebLLMWorker] Chat history cleared");
}

async function unloadModel(): Promise<void> {
	if (engine) {
		console.debug(`[WebLLMWorker] Unloading model ${currentModel}`);
		await engine.unload();
		engine = null;
		isInitialized = false;
		chatHistory = [];
		currentModel = null;
		console.debug("[WebLLMWorker] Model unloaded, all state reset");
	} else {
		console.debug("[WebLLMWorker] No engine to unload");
	}
}
