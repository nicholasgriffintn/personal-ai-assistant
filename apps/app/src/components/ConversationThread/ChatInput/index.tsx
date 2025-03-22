import { Image, Mic, Pause, Send, Square, X } from "lucide-react";
import {
	type ChangeEvent,
	type Dispatch,
	type FormEvent,
	type KeyboardEvent,
	type SetStateAction,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

import { Button } from "~/components/ui";
import { useModels } from "~/hooks/useModels";
import { useVoiceRecorder } from "~/hooks/useVoiceRecorder";
import { useChatStore } from "~/state/stores/chatStore";
import type { ModelConfigItem } from "~/types";
import { ChatSettings as ChatSettingsComponent } from "./ChatSettings";
import { ModelSelector } from "./ModelSelector";

export interface ChatInputHandle {
	focus: () => void;
}

interface ChatInputProps {
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	handleSubmit: (e: FormEvent, imageData?: string) => void;
	isLoading: boolean;
	streamStarted: boolean;
	controller: AbortController;
	onTranscribe: (data: { response: { content: string } }) => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
	(
		{
			input,
			setInput,
			handleSubmit,
			isLoading,
			streamStarted,
			controller,
			onTranscribe,
		},
		ref,
	) => {
		const { model } = useChatStore();
		const { isPro, currentConversationId } = useChatStore();
		const { isRecording, isTranscribing, startRecording, stopRecording } =
			useVoiceRecorder({ onTranscribe });
		const [selectedImage, setSelectedImage] = useState<string | null>(null);
		const [isMultimodalModel, setIsMultimodalModel] = useState(false);
		const { data: apiModels } = useModels();

		const textareaRef = useRef<HTMLTextAreaElement>(null);
		const fileInputRef = useRef<HTMLInputElement>(null);

		useImperativeHandle(ref, () => ({
			focus: () => {
				textareaRef.current?.focus();
			},
		}));

		// biome-ignore lint/correctness/useExhaustiveDependencies: This is a side effect that should only run when the input changes
		useEffect(() => {
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
				textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
			}
		}, [input]);

		useEffect(() => {
			if (!apiModels || !model) {
				setIsMultimodalModel(false);
				return;
			}

			const modelData = apiModels[model] as ModelConfigItem | undefined;

			const isMultimodal =
				modelData?.multimodal || modelData?.type?.includes("image-to-text");
			setIsMultimodalModel(!!isMultimodal);
		}, [model, apiModels]);

		const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				clearSelectedImage();
				handleSubmit(e as unknown as FormEvent, selectedImage || undefined);
			}
			if (e.key === "Enter" && e.shiftKey) {
				e.preventDefault();
				setInput((prev: string) => `${prev}\n`);
			}
		};

		const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				setSelectedImage(base64String);
			};
			reader.readAsDataURL(file);
		};

		const clearSelectedImage = () => {
			setSelectedImage(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		};

		const handleFormSubmit = (e: FormEvent) => {
			clearSelectedImage();
			handleSubmit(e, selectedImage || undefined);
		};

		return (
			<div className="relative rounded-lg border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-[#121212] shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 focus-within:border-zinc-300 dark:focus-within:border-zinc-500 transition-colors">
				<div className="flex flex-col">
					{selectedImage && (
						<div className="px-3 pt-3">
							<div className="relative inline-flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-md p-1.5 border border-zinc-200 dark:border-zinc-700">
								<img
									src={selectedImage}
									alt="Selected"
									className="h-6 w-6 rounded object-cover"
								/>
								<span className="text-xs text-zinc-600 dark:text-zinc-400">
									Image attached
								</span>
								<Button
									type="button"
									onClick={clearSelectedImage}
									variant="icon"
									className="ml-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
									title="Remove image"
									aria-label="Remove image"
								>
									<X size={14} />
								</Button>
							</div>
						</div>
					)}
					<div className="relative">
						<div className="flex items-start">
							<textarea
								id="message-input"
								ref={textareaRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={
									!currentConversationId
										? "Ask me anything..."
										: "Ask follow-up questions..."
								}
								disabled={isRecording || isTranscribing || isLoading}
								className="flex-grow px-4 py-3 text-base bg-transparent resize-none focus:outline-none dark:text-white min-h-[60px] max-h-[200px]"
								rows={1}
								aria-label="Message input"
								aria-describedby="message-input-help"
							/>
							<div id="message-input-help" className="sr-only">
								Type your message and press Enter to send. Use Shift+Enter for a
								new line.
							</div>

							<div className="flex-shrink-0 flex items-center gap-1 pr-3 pt-3">
								{isLoading && streamStarted ? (
									<Button
										type="button"
										onClick={() => controller.abort()}
										variant="icon"
										className="cursor-pointer p-2 hover:bg-off-white-highlight dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400"
										title="Stop generating"
										aria-label="Stop generating"
									>
										<Pause className="h-5 w-5" />
									</Button>
								) : (
									<>
										{isPro && (
											<div className="flex items-center gap-1 mr-2">
												{isMultimodalModel && (
													<>
														<input
															type="file"
															ref={fileInputRef}
															accept="image/*"
															onChange={handleImageUpload}
															className="hidden"
															id="image-upload"
															aria-label="Upload an image"
														/>
														<Button
															type="button"
															onClick={() => fileInputRef.current?.click()}
															disabled={isLoading}
															className="cursor-pointer p-1.5 hover:bg-off-white-highlight dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
															title="Upload Image"
															aria-label="Upload Image"
															variant="icon"
															aria-haspopup="dialog"
															aria-controls="image-upload"
														>
															<Image className="h-4 w-4" />
														</Button>
													</>
												)}
												{isRecording ? (
													<Button
														type="button"
														onClick={stopRecording}
														disabled={isLoading}
														className="cursor-pointer p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
														title="Stop Recording"
														aria-label="Stop Recording"
														variant="icon"
													>
														<Square className="h-4 w-4" />
													</Button>
												) : isTranscribing ? (
													<div
														className="p-2 text-zinc-600 dark:text-zinc-400"
														aria-live="polite"
														// biome-ignore lint/a11y/useSemanticElements: I don't want to use output
														role="status"
													>
														<div
															className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 dark:border-zinc-400 border-t-transparent"
															aria-hidden="true"
														/>
														<span className="sr-only">
															Transcribing voice input...
														</span>
													</div>
												) : (
													<Button
														type="button"
														onClick={startRecording}
														disabled={isLoading}
														className="cursor-pointer p-1.5 hover:bg-off-white-highlight dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
														title="Start Recording"
														aria-label="Start Recording"
														variant="icon"
													>
														<Mic className="h-4 w-4" />
													</Button>
												)}
											</div>
										)}

										<Button
											type="submit"
											onClick={handleFormSubmit}
											disabled={(!input?.trim() && !selectedImage) || isLoading}
											className="cursor-pointer p-2.5 bg-black hover:bg-zinc-800 dark:bg-off-white dark:hover:bg-zinc-200 rounded-md text-white dark:text-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											title="Send message"
											aria-label="Send message"
										>
											<Send className="h-5 w-5" />
											<span className="sr-only">Send message</span>
										</Button>
									</>
								)}
							</div>
						</div>
					</div>

					<div className="border-t border-zinc-200 dark:border-zinc-700 mt-2 px-3 pb-3 pt-3">
						<div className="flex items-center justify-between gap-1 sm:gap-2">
							<div className="flex-1 min-w-0 max-w-[70%] sm:max-w-none">
								<ModelSelector isDisabled={isLoading} mono={true} />
							</div>
							<div className="flex-shrink-0">
								<ChatSettingsComponent isDisabled={isLoading} />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
);
