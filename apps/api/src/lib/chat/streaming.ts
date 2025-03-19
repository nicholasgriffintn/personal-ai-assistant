import type { ChatMode, IEnv, IUser, Platform } from "../../types";
import { handleToolCalls } from "../chat/tools";
import type { ConversationManager } from "../conversationManager";
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
		mode?: ChatMode;
		isRestricted?: boolean;
	},
	conversationManager: ConversationManager,
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

	let fullContent = "";
	let citationsResponse = [];
	let toolCallsData: any[] = [];
	let usageData: any = null;
	let postProcessingDone = false;
	let buffer = "";

	const guardrails = Guardrails.getInstance(env);

	return providerStream.pipeThrough(
		new TransformStream({
			async transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk);

				if (text.includes("data: [DONE]")) {
					const textWithoutDone = text.replace("data: [DONE]", "").trim();
					if (textWithoutDone) {
						controller.enqueue(
							new TextEncoder().encode(`${textWithoutDone}\n\n`),
						);
					}
				} else {
					controller.enqueue(chunk);
				}

				buffer += text;

				const events = buffer.split("\n\n");
				buffer = events.pop() || "";

				for (const event of events) {
					if (!event.trim()) continue;

					if (event.startsWith("data: ")) {
						const dataStr = event.substring(6).trim();

						if (dataStr === "[DONE]") {
							if (!postProcessingDone) {
								await handlePostProcessing();
							}
							continue;
						}

						try {
							const data = JSON.parse(dataStr);

							if (data.response !== undefined) {
								fullContent += data.response;
							} else if (
								data.choices &&
								data.choices.length > 0 &&
								data.choices[0].delta &&
								data.choices[0].delta.content
							) {
								fullContent += data.choices[0].delta.content;
							}

							if (data.citations) {
								citationsResponse = data.citations;
							}

							if (data.usage) {
								usageData = data.usage;
							}

							if (data.tool_calls) {
								toolCallsData = [...toolCallsData, ...data.tool_calls];
							}
						} catch (parseError) {
							console.error("Parse error", parseError);
						}
					}
				}

				async function handlePostProcessing() {
					try {
						postProcessingDone = true;

						let guardrailsFailed = false;
						let guardrailError = "";
						let violations: any[] = [];

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
										input: fullContent,
										model,
										date: new Date().toISOString().split("T")[0],
									},
									app_url,
									user: user?.id ? user : undefined,
								},
								isRestricted,
							);

							toolResults = results;
						}

						// TODO: Need to push tool results out still.

						const logId = env.AI?.aiGatewayLogId;

						await conversationManager.add(completion_id, {
							role: "assistant",
							content: fullContent,
							citations: citationsResponse,
							log_id: logId,
							mode,
							id: Math.random().toString(36).substring(2, 7),
							timestamp: Date.now(),
							model,
							platform,
						});

						const metadata = {
							nonce: Math.random().toString(36).substring(2, 7),
							response: "",
							post_processing: {
								guardrails: {
									passed: !guardrailsFailed,
									error: guardrailError,
									violations,
								},
								log_id: logId,
							},
							usage: usageData,
						};

						const metadataChunk = new TextEncoder().encode(
							`data: ${JSON.stringify(metadata)}\n\n`,
						);
						controller.enqueue(metadataChunk);

						controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
					} catch (error) {
						console.error("Error in stream post-processing:", error);
					}
				}
			},
		}),
	);
}
