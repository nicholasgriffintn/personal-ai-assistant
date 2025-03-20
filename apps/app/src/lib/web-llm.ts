import type { ChatMode, ChatRole, Message } from "~/types";

export class WebLLMService {
	private static instance: WebLLMService;
	private worker: Worker | null = null;
	private isInitialized = false;
	private currentModel: string | null = null;
	private progressCallback: ((report: any) => void) | undefined;
	private messageCallbacks: Map<string, (type: string, data: any) => void> =
		new Map();

	private constructor() {
		console.debug("[WebLLMService] Constructor called");
	}

	public static getInstance(): WebLLMService {
		if (!WebLLMService.instance) {
			WebLLMService.instance = new WebLLMService();
		}
		return WebLLMService.instance;
	}

	getCurrentModel(): string | null {
		return this.currentModel;
	}

	private initWorker() {
		if (this.worker) return;

		console.debug("[WebLLMService] Initializing worker");
		const workerURL = new URL("./web-llm-worker.ts", import.meta.url);
		this.worker = new Worker(workerURL, {
			type: "module",
		});

		this.worker.onmessage = (e: MessageEvent) => {
			const { type, ...data } = e.data;
			console.debug(`[WebLLMService] Message from worker: ${type}`, data);

			if (type === "progress" && this.progressCallback) {
				console.debug(
					`[WebLLMService] Progress update: ${data.progress * 100}%`,
					data.text,
				);
				this.progressCallback({
					progress: data.progress,
					text: data.text,
				});
			}

			if (type === "error") {
				console.error("[WebLLMService] Worker error:", data.error);
			}

			for (const [callbackId, callback] of this.messageCallbacks) {
				console.debug(
					`[WebLLMService] Forwarding ${type} to callback ${callbackId}`,
				);
				callback(type, data);
			}
		};

		this.worker.onerror = (error) => {
			console.error("[WebLLMService] Worker error:", error);
		};
	}

	async init(
		model: string,
		progressCallback?: (report: any) => void,
	): Promise<void> {
		console.debug(
			`[WebLLMService] Init called for model: ${model}, current model: ${this.currentModel}, initialized: ${this.isInitialized}`,
		);

		if (this.currentModel !== model) {
			console.debug(
				`[WebLLMService] Model changed from ${this.currentModel} to ${model}, resetting initialized state`,
			);
			this.isInitialized = false;
		}

		if (!this.isInitialized) {
			console.debug(`[WebLLMService] Starting initialization for ${model}`);
			this.progressCallback = progressCallback;
			if (progressCallback) {
				console.debug("[WebLLMService] Progress callback provided");
				progressCallback({
					progress: 0.01,
					text: `Starting initialization for ${model}...`,
				});
			} else {
				console.warn("[WebLLMService] No progress callback provided");
			}

			if (
				this.worker &&
				this.currentModel !== null &&
				this.currentModel !== model
			) {
				console.debug(
					`[WebLLMService] Unloading previous model ${this.currentModel}`,
				);
				await this.unload();
			}

			this.initWorker();

			if (!this.worker) {
				throw new Error("Failed to initialize worker");
			}

			const initId = `init-${model}-${Date.now()}`;
			console.debug(`[WebLLMService] Initialization ID: ${initId}`);

			this.worker.postMessage({
				action: "init",
				payload: {
					model,
					progressId: "model-init",
				},
			});

			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					console.error(
						`[WebLLMService] Initialization timeout for model ${model}`,
					);
					this.messageCallbacks.delete(initId);
					reject(new Error(`Initialization timeout for model ${model}`));
				}, 60000); // 1 minute timeout

				const callback = (type: string, data: any) => {
					console.debug(
						`[WebLLMService] Init callback received: ${type}`,
						data,
					);
					if (type === "init_complete" && data.model === model) {
						console.debug(
							`[WebLLMService] Initialization complete for ${model}`,
						);
						clearTimeout(timeout);
						this.messageCallbacks.delete(initId);
						this.isInitialized = true;
						this.currentModel = model;
						resolve();
					} else if (type === "error") {
						console.error("[WebLLMService] Initialization error:", data.error);
						clearTimeout(timeout);
						this.messageCallbacks.delete(initId);
						reject(new Error(data.error));
					}
				};

				console.debug(
					`[WebLLMService] Registering init callback with ID ${initId}`,
				);
				this.messageCallbacks.set(initId, callback);
			});

			console.debug(
				`[WebLLMService] Initialization promise resolved for ${model}`,
			);
		} else {
			console.debug(
				`[WebLLMService] Model ${model} already initialized, skipping init`,
			);
		}
	}

	async generate(
		selectedChat: string,
		prompt: string,
		onSendMessage: (
			completion_id: string,
			message: string,
			model: string,
			mode: ChatMode,
			role: ChatRole,
		) => Promise<Message[]>,
		onProgress?: (text: string) => void,
	): Promise<string> {
		if (!this.isInitialized || !this.currentModel || !this.worker) {
			throw new Error("Engine or model not initialized");
		}

		await onSendMessage(
			selectedChat,
			prompt,
			this.currentModel,
			"local",
			"user",
		);

		const generationId = crypto.randomUUID();
		let generatedContent = "";

		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.messageCallbacks.delete(generationId);
				reject(new Error("Generation timeout"));
			}, 300000); // 5 minute timeout

			const callback = (type: string, data: any) => {
				if (type === "progress_text" && data.selectedChat === selectedChat) {
					if (onProgress && data.delta) {
						onProgress(data.delta);
					}
				} else if (
					type === "assistant_message_complete" &&
					data.selectedChat === selectedChat
				) {
					clearTimeout(timeout);
					generatedContent = data.content;

					onSendMessage(
						selectedChat,
						data.content,
						this.currentModel!,
						"local",
						"assistant",
					).catch(console.error);

					this.messageCallbacks.delete(generationId);
					resolve();
				} else if (type === "error") {
					clearTimeout(timeout);
					this.messageCallbacks.delete(generationId);
					reject(new Error(data.error));
				}
			};

			this.messageCallbacks.set(generationId, callback);

			this.worker!.postMessage({
				action: "generate",
				payload: {
					selectedChat,
					prompt,
					model: this.currentModel,
				},
			});
		});

		return generatedContent;
	}

	async resetChat(): Promise<void> {
		if (!this.worker) {
			throw new Error("Engine not initialized");
		}

		await new Promise<void>((resolve, reject) => {
			const resetId = `reset-${Date.now()}`;
			const timeout = setTimeout(() => {
				this.messageCallbacks.delete(resetId);
				reject(new Error("Reset timeout"));
			}, 10000); // 10 second timeout

			const callback = (type: string, data: any) => {
				if (type === "reset_complete") {
					clearTimeout(timeout);
					this.messageCallbacks.delete(resetId);
					resolve();
				} else if (type === "error") {
					clearTimeout(timeout);
					this.messageCallbacks.delete(resetId);
					reject(new Error(data.error));
				}
			};

			this.messageCallbacks.set(resetId, callback);
			this.worker!.postMessage({ action: "reset" });
		});
	}

	async unload(): Promise<void> {
		if (this.worker) {
			await new Promise<void>((resolve) => {
				const unloadId = `unload-${Date.now()}`;
				const timeout = setTimeout(() => {
					this.messageCallbacks.delete(unloadId);
					resolve();
				}, 5000); // 5 second timeout

				const callback = (type: string) => {
					if (type === "unload_complete" || type === "error") {
						clearTimeout(timeout);
						this.messageCallbacks.delete(unloadId);
						resolve();
					}
				};

				this.messageCallbacks.set(unloadId, callback);
				this.worker!.postMessage({ action: "unload" });

				setTimeout(() => {
					this.worker!.terminate();
					this.worker = null;
					this.isInitialized = false;
					this.currentModel = null;
					this.messageCallbacks.clear();
				}, 500);
			});
		}
	}
}
