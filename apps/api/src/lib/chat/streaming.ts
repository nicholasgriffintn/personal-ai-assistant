import type { IEnv, IUser, Platform } from "../../types";
import { handleToolCalls } from "../chat/tools";
import { ConversationManager } from "../conversationManager";
import { Guardrails } from "../guardrails";

export function createStreamWithPostProcessing(
	providerStream: ReadableStream,
	options: {
		env: IEnv;
		completion_id: string;
		model: string;
		platform?: Platform;
		user?: IUser;
		app_url?: string;
		mode?: string;
		isRestricted?: boolean;
	},
): ReadableStream {
	const {
		env,
		completion_id,
		model,
		platform = "api",
		user,
		app_url,
		mode,
		isRestricted,
	} = options;

	// Initialize state to accumulate the full response
	let fullContent = "";
	let toolCallsData: any[] = [];
	let usageData: any = null;
	let postProcessingDone = false;

	const conversationManager = ConversationManager.getInstance({
		database: env.DB,
		userId: user?.id,
		model: model,
		platform,
	});

	const guardrails = Guardrails.getInstance(env);

	return providerStream.pipeThrough(
		new TransformStream({
			async transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk);

				try {
					if (text.startsWith("data: ") && !text.includes("[DONE]")) {
						const dataStr = text.slice(6).trim();
						if (dataStr) {
							try {
								const data = JSON.parse(dataStr);

								if (data.response !== undefined) {
									fullContent += data.response;
								}

								if (data.usage) {
									usageData = data.usage;
								}

								if (data.tool_calls) {
									toolCallsData = [...toolCallsData, ...data.tool_calls];
								}
							} catch (parseError) {
								// Ignore parse errors, not all chunks might be valid JSON
							}
						}
					}
				} catch (error) {
					console.error("Error processing stream chunk:", error);
				}

				if (text.includes("data: [DONE]")) {
					if (!postProcessingDone) {
						const textWithoutDone = text.replace("data: [DONE]", "").trim();
						if (textWithoutDone) {
							controller.enqueue(
								new TextEncoder().encode(`${textWithoutDone}\n\n`),
							);
						}
						await handlePostProcessing();
						controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
					}
				} else {
					controller.enqueue(chunk);
				}

				async function handlePostProcessing() {
					try {
						postProcessingDone = true;

						// 1. Validate output with guardrails
						let guardrailsFailed = false;
						let guardrailError = "";
						let violations = [];

						if (fullContent) {
							const outputValidation =
								await guardrails.validateOutput(fullContent);
							if (!outputValidation.isValid) {
								guardrailsFailed = true;
								guardrailError =
									outputValidation.rawResponse?.blockedResponse ||
									"Response did not pass safety checks";
								violations = outputValidation.violations || [];
							}
						}

						// 2. Handle tool calls if any
						let toolResults = [];
						if (toolCallsData.length > 0 && !isRestricted) {
							const results = await handleToolCalls(
								completion_id,
								{ response: fullContent, tool_calls: toolCallsData },
								conversationManager,
								{
									env,
									request: {
										completion_id,
										model,
										date: new Date().toISOString().split("T")[0],
									},
									app_url,
									user: user?.id ? user : undefined,
								},
							);

							toolResults = results;
						}

						// 3. Save to conversation history
						await conversationManager.add(completion_id, {
							role: "assistant",
							content: fullContent,
							citations: null,
							log_id: env.AI?.aiGatewayLogId || "",
							mode,
							id: Math.random().toString(36).substring(2, 7),
							timestamp: Date.now(),
							model,
							platform,
						});

						// 4. Create metadata about post-processing
						const metadata = {
							nonce: Math.random().toString(36).substring(2, 7),
							response: "", // Empty response as we already accumulated it
							post_processing: {
								guardrails: {
									passed: !guardrailsFailed,
									error: guardrailError,
									violations,
								},
								tool_calls_processed: toolCallsData.length > 0,
								tool_results: toolResults.length,
								conversation_saved: true,
							},
							usage: usageData,
						};

						// 5. Send the metadata chunk
						const metadataChunk = new TextEncoder().encode(
							`data: ${JSON.stringify(metadata)}\n\n`,
						);
						controller.enqueue(metadataChunk);
					} catch (error) {
						console.error("Error in stream post-processing:", error);
					}
				}
			},
		}),
	);
}
