import {
	type FormEvent,
	type KeyboardEvent,
	useRef,
	useEffect,
	type Dispatch,
	type SetStateAction,
	type FC,
	useState,
	type ChangeEvent,
} from "react";
import { Send, Pause, Mic, Square, Image } from "lucide-react";

import type { ChatMode, ChatSettings, ModelConfigItem } from "../types";
import { ChatSettings as ChatSettingsComponent } from "./ChatSettings";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { useChatStore } from "../stores/chatStore";
import { ModelSelector } from "./ModelSelector";
import { useModels } from "../hooks/useModels";

interface ChatInputProps {
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	handleSubmit: (e: FormEvent, imageData?: string) => void;
	isLoading: boolean;
	streamStarted: boolean;
	controller: AbortController;
	mode: ChatMode;
	onModeChange: (mode: ChatMode) => void;
	model: string;
	onModelChange: (model: string) => void;
	chatSettings: ChatSettings;
	onChatSettingsChange: (settings: ChatSettings) => void;
	onTranscribe: (data: { response: { content: string } }) => void;
}

export const ChatInput: FC<ChatInputProps> = ({
	input,
	setInput,
	handleSubmit,
	isLoading,
	streamStarted,
	controller,
	mode,
	onModeChange,
	model,
	onModelChange,
	chatSettings,
	onChatSettingsChange,
	onTranscribe,
}) => {
	const { hasApiKey } = useChatStore();
	const { isRecording, isTranscribing, startRecording, stopRecording } =
		useVoiceRecorder({ onTranscribe });
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [isMultimodalModel, setIsMultimodalModel] = useState(false);
	const { data: apiModels } = useModels();

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

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
		console.log(modelData);
		const isMultimodal = modelData?.multimodal || 
			(modelData?.type && (
				modelData.type.includes("image-to-text")
			));
		setIsMultimodalModel(!!isMultimodal);
	}, [model, apiModels]);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
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
		handleSubmit(e, selectedImage || undefined);
		clearSelectedImage();
	};

	return (
		<div className="relative rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
			<div className="flex flex-col">
				{selectedImage && (
					<div className="px-4 pt-3 pb-1">
						<div className="relative inline-block">
							<img 
								src={selectedImage} 
								alt="Selected" 
								className="max-h-32 max-w-full rounded-md object-contain"
							/>
							<button
								type="button"
								onClick={clearSelectedImage}
								className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
							>
								×
							</button>
						</div>
					</div>
				)}
				<div className="relative">
					<textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask me anything..."
						disabled={isRecording || isTranscribing || isLoading}
						className="w-full px-4 py-3 text-base bg-transparent resize-none focus:outline-none dark:text-white min-h-[60px] max-h-[200px]"
						rows={1}
					/>

					<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
						{isLoading && streamStarted ? (
							<button
								type="button"
								onClick={() => controller.abort()}
								className="cursor-pointer p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400"
							>
								<Pause className="h-4 w-4" />
								<span className="sr-only">Stop generating</span>
							</button>
						) : (
							<>
								{hasApiKey && (
									<>
										{isMultimodalModel && (
											<>
												<input
													type="file"
													ref={fileInputRef}
													accept="image/*"
													onChange={handleImageUpload}
													className="hidden"
													id="image-upload"
												/>
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													disabled={isLoading}
													className="cursor-pointer p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<Image className="h-4 w-4" />
													<span className="sr-only">Upload Image</span>
												</button>
											</>
										)}
										{isRecording ? (
											<button
												type="button"
												onClick={stopRecording}
												disabled={isLoading}
												className="cursor-pointer p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<Square className="h-4 w-4" />
												<span className="sr-only">Stop Recording</span>
											</button>
										) : isTranscribing ? (
											<div className="p-2 text-zinc-600 dark:text-zinc-400">
												<div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 dark:border-zinc-400 border-t-transparent" />
												<span className="sr-only">Transcribing...</span>
											</div>
										) : (
											<button
												type="button"
												onClick={startRecording}
												disabled={isLoading}
												className="cursor-pointer p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<Mic className="h-4 w-4" />
												<span className="sr-only">Start Recording</span>
											</button>
										)}
									</>
								)}

								<button
									type="submit"
									onClick={handleFormSubmit}
									disabled={(!input?.trim() && !selectedImage) || isLoading}
									className="cursor-pointer p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Send className="h-4 w-4" />
									<span className="sr-only">Send message</span>
								</button>
							</>
						)}
					</div>
				</div>

				<div className="border-t border-zinc-200 dark:border-zinc-700 mt-2 px-3 pb-3 pt-3">
					<div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
						<div className="flex-1 min-w-0">
							<ModelSelector
								mode={mode}
								model={model}
								onModelChange={onModelChange}
								hasApiKey={hasApiKey}
								isDisabled={isLoading}
							/>
						</div>
						<div className="flex-shrink-0">
							<ChatSettingsComponent
								settings={chatSettings}
								onSettingsChange={onChatSettingsChange}
								isDisabled={isLoading}
								mode={mode}
								onModeChange={onModeChange}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
