import {
	type FormEvent,
	type KeyboardEvent,
	useRef,
	useEffect,
	type Dispatch,
	type SetStateAction,
	type FC,
} from "react";
import { Send, Pause, Mic, Square } from "lucide-react";

import { modelsOptions } from "../lib/models";
import type { ChatMode, ChatSettings } from "../types";
import { ChatSettings as ChatSettingsComponent } from "./ChatSettings";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { useChatStore } from "../stores/chatStore";
import { ModelSelector } from "./ModelSelector";

interface ChatInputProps {
	input: string;
	setInput: Dispatch<SetStateAction<string>>;
	handleSubmit: (e: FormEvent) => void;
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

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const selectedModelInfo = modelsOptions.find((m) => m.id === model);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [input]);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e as unknown as FormEvent);
		}
		if (e.key === "Enter" && e.shiftKey) {
			e.preventDefault();
			setInput((prev: string) => `${prev}\n`);
		}
	};

	const getModelInfo = () => (
		<div className="space-y-2">
			<h4 className="font-medium text-zinc-900 dark:text-zinc-100">
				{selectedModelInfo?.name}
			</h4>
			<div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
				<p>{selectedModelInfo?.description}</p>
				{selectedModelInfo?.capabilities && (
					<p>Capabilities: {selectedModelInfo.capabilities.join(", ")}</p>
				)}
				<p>
					Mode: {selectedModelInfo?.isLocal ? "Running locally" : "Cloud-based"}
				</p>
			</div>
		</div>
	);

	return (
		<div className="relative rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
			<div className="flex flex-col">
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
								className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400"
							>
								<Pause className="h-4 w-4" />
								<span className="sr-only">Stop generating</span>
							</button>
						) : (
							<>
								{hasApiKey && (
									<>
										{isRecording ? (
											<button
												type="button"
												onClick={stopRecording}
												disabled={isLoading}
												className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
												className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<Mic className="h-4 w-4" />
												<span className="sr-only">Start Recording</span>
											</button>
										)}
									</>
								)}

								<button
									type="submit"
									onClick={(e) => handleSubmit(e)}
									disabled={!input?.trim() || isLoading}
									className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Send className="h-4 w-4" />
									<span className="sr-only">Send message</span>
								</button>
							</>
						)}
					</div>
				</div>

				<div className="border-t border-zinc-200 dark:border-zinc-700 mt-2 px-3 pb-3 pt-3">
					<div className="flex items-center gap-2">
						<label htmlFor="mode" className="sr-only">
							Mode
						</label>
						<select
							id="mode"
							value={mode}
							onChange={(e) => {
								onModeChange(e.target.value as ChatMode);
								onModelChange("");
							}}
							disabled={isLoading}
							className="px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
						>
							<option value="remote">Remote (Cloud)</option>
							<option value="local">Local (WebLLM)</option>
							<option value="prompt_coach">Prompt Coach</option>
						</select>

						<ModelSelector
							mode={mode}
							model={model}
							onModelChange={onModelChange}
							hasApiKey={hasApiKey}
							isDisabled={isLoading}
						/>

						<ChatSettingsComponent
							settings={chatSettings}
							onSettingsChange={onChatSettingsChange}
							isDisabled={isLoading}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
