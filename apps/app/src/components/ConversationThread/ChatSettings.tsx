import { CloudOff, Computer, Settings, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui";
import { defaultModel } from "~/lib/models";
import { useChatStore } from "~/state/stores/chatStore";
import type { ChatSettings as ChatSettingsType } from "~/types";

interface ChatSettingsProps {
	isDisabled?: boolean;
}

export const ChatSettings = ({ isDisabled = false }: ChatSettingsProps) => {
	const {
		isPro,
		chatSettings,
		setChatSettings,
		chatMode,
		setChatMode,
		setModel,
	} = useChatStore();
	const [showSettings, setShowSettings] = useState(false);
	const [promptCoach, setPromptCoach] = useState(chatMode === "prompt_coach");
	const [useLocalModel, setUseLocalModel] = useState(chatMode === "local");
	const [localOnly, setLocalOnly] = useState(chatSettings.localOnly || false);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const settingsButtonRef = useRef<HTMLButtonElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const responseSelectRef = useRef<HTMLSelectElement>(null);
	const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");

	useEffect(() => {
		setPromptCoach(chatMode === "prompt_coach");
		setUseLocalModel(chatMode === "local");
		setLocalOnly(chatSettings.localOnly || false);
	}, [chatMode, chatSettings.localOnly]);

	const showDialog = () => {
		dialogRef.current?.showModal();
		setShowSettings(true);
		setTimeout(() => {
			titleRef.current?.focus();
		}, 50);
	};

	const closeDialog = () => {
		dialogRef.current?.close();
		setShowSettings(false);
		settingsButtonRef.current?.focus();
	};

	const handleEnableLocalModels = () => {
		const newValue = !useLocalModel;
		setUseLocalModel(newValue);
		setChatMode(newValue ? "local" : "remote");

		if (newValue) {
			setLocalOnly(true);
			setChatSettings({
				...chatSettings,
				localOnly: true,
			});
			setModel("");
		} else {
			setLocalOnly(false);
			setChatSettings({
				...chatSettings,
				localOnly: false,
			});
			setModel(defaultModel);
		}
	};

	const handleEnablePromptCoach = () => {
		if (useLocalModel) {
			setPromptCoach(false);
			return;
		}

		const newValue = !promptCoach;
		setPromptCoach(newValue);
		setChatMode(newValue ? "prompt_coach" : "remote");
	};

	const handleLocalOnlyToggle = () => {
		if (useLocalModel && localOnly) {
			return;
		}

		const newValue = !localOnly;
		setLocalOnly(newValue);
		setChatSettings({
			...chatSettings,
			localOnly: newValue,
		});
	};

	const handleSettingChange = (
		key: keyof ChatSettingsType,
		value: string | boolean,
	) => {
		if (typeof value === "string") {
			if (key === "responseMode") {
				setChatSettings({
					...chatSettings,
					[key]: value as ChatSettingsType["responseMode"],
				});
				return;
			}

			const numValue = Number.parseFloat(value);
			if (!Number.isNaN(numValue)) {
				setChatSettings({
					...chatSettings,
					[key]: numValue,
				});
				return;
			}

			setChatSettings({
				...chatSettings,
				[key]: value,
			});
		} else {
			setChatSettings({
				...chatSettings,
				[key]: value,
			});
		}
	};

	const handleRagOptionChange = (
		key: keyof NonNullable<ChatSettingsType["ragOptions"]>,
		value: string | boolean,
	) => {
		if (typeof value === "boolean") {
			setChatSettings({
				...chatSettings,
				ragOptions: {
					...chatSettings.ragOptions,
					[key]: value,
				},
			});
			return;
		}

		const numValue = Number.parseFloat(value);
		setChatSettings({
			...chatSettings,
			ragOptions: {
				...chatSettings.ragOptions,
				[key]: !Number.isNaN(numValue) ? numValue : value,
			},
		});
	};

	const handleDialogKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			closeDialog();
		}

		if (e.key === "Tab") {
			const focusableElements = dialogRef.current?.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			) as NodeListOf<HTMLElement>;

			if (!focusableElements?.length) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault();
				lastElement.focus();
			} else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault();
				firstElement.focus();
			}
		}
	};

	return (
		<div className="relative">
			<Button
				variant={useLocalModel ? "iconActive" : "icon"}
				icon={<Computer className="h-4 w-4" />}
				onClick={handleEnableLocalModels}
				title={useLocalModel ? "Use Remote Models" : "Use Local Models"}
				aria-label={useLocalModel ? "Use Remote Models" : "Use Local Models"}
			/>
			<Button
				variant={promptCoach ? "iconActive" : "icon"}
				icon={<Sparkles className="h-4 w-4" />}
				onClick={handleEnablePromptCoach}
				disabled={useLocalModel}
				title={
					promptCoach
						? "Disable Prompt Enhancement"
						: "Enable Prompt Enhancement"
				}
				aria-label={
					promptCoach
						? "Disable Prompt Enhancement"
						: "Enable Prompt Enhancement"
				}
			/>

			{isPro && (
				<Button
					variant={localOnly ? "iconActive" : "icon"}
					icon={<CloudOff className="h-4 w-4" />}
					onClick={handleLocalOnlyToggle}
					disabled={useLocalModel}
					title={
						useLocalModel
							? "Local models are always stored locally"
							: localOnly
								? "Store on server"
								: "Local-only (not stored on server)"
					}
					aria-label={
						useLocalModel
							? "Local models are always stored locally"
							: localOnly
								? "Store on server"
								: "Local-only (not stored on server)"
					}
					className={useLocalModel ? "opacity-50 cursor-not-allowed" : ""}
				/>
			)}

			<Button
				ref={settingsButtonRef}
				variant="icon"
				icon={<Settings className="h-4 w-4" />}
				onClick={showDialog}
				disabled={isDisabled}
				aria-haspopup="dialog"
				aria-expanded={showSettings}
				title="Chat settings"
				aria-label="Open chat settings"
			/>

			<dialog
				ref={dialogRef}
				className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full p-0 bg-off-white dark:bg-zinc-900 rounded-lg shadow-xl backdrop:bg-black/50 max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-700 m-0"
				onClick={(e) => {
					if (e.target === dialogRef.current) {
						closeDialog();
					}
				}}
				onKeyDown={handleDialogKeyDown}
				aria-labelledby="chat-settings-title"
				aria-modal="true"
			>
				<div className="relative p-4">
					<div className="flex justify-between items-center mb-4">
						<h4
							ref={titleRef}
							id="chat-settings-title"
							className="font-medium text-zinc-900 dark:text-zinc-100 text-2xl"
							tabIndex={-1}
						>
							Chat Settings
						</h4>
						<Button
							variant="ghost"
							icon={<X size={24} strokeWidth={2.5} />}
							onClick={closeDialog}
							className="p-2 rounded-lg"
							aria-label="Close settings dialog"
						/>
					</div>

					<div className="space-y-4">
						<div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-4">
							<Button
								variant={activeTab === "basic" ? "primary" : "secondary"}
								className={`px-4 py-2 text-sm font-medium w-1/2 text-center rounded-none ${
									activeTab === "basic"
										? "bg-white dark:bg-zinc-800 border-b-2 border-blue-500 dark:border-blue-500"
										: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
								}`}
								onClick={() => setActiveTab("basic")}
								aria-selected={activeTab === "basic"}
								role="tab"
							>
								Basic Settings
							</Button>
							<Button
								variant={activeTab === "advanced" ? "primary" : "secondary"}
								className={`px-4 py-2 text-sm font-medium w-1/2 text-center rounded-none ${
									activeTab === "advanced"
										? "bg-white dark:bg-zinc-800 border-b-2 border-blue-500 dark:border-blue-500"
										: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
								}`}
								onClick={() => setActiveTab("advanced")}
								aria-selected={activeTab === "advanced"}
								role="tab"
							>
								Advanced Settings
							</Button>
						</div>

						{activeTab === "basic" && (
							<div className="space-y-6">
								<div>
									<label
										htmlFor="responseMode"
										className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
									>
										Response Mode
									</label>
									<select
										ref={responseSelectRef}
										id="responseMode"
										value={chatSettings.responseMode ?? "normal"}
										onChange={(e) =>
											handleSettingChange("responseMode", e.target.value)
										}
										disabled={isDisabled}
										className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 mt-1"
										aria-describedby={
											chatSettings.responseMode === "concise"
												? "response-mode-concise"
												: chatSettings.responseMode === "explanatory"
													? "response-mode-explanatory"
													: chatSettings.responseMode === "formal"
														? "response-mode-formal"
														: "response-mode-normal"
										}
									>
										<option value="normal">Normal</option>
										<option value="concise">Concise</option>
										<option value="explanatory">Explanatory</option>
										<option value="formal">Formal</option>
									</select>
									<div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
										{chatSettings.responseMode === "concise" && (
											<span id="response-mode-concise">
												Brief, to-the-point responses
											</span>
										)}
										{chatSettings.responseMode === "explanatory" && (
											<span id="response-mode-explanatory">
												Detailed explanations with examples
											</span>
										)}
										{chatSettings.responseMode === "formal" && (
											<span id="response-mode-formal">
												Professional, structured responses
											</span>
										)}
										{(chatSettings.responseMode === "normal" ||
											!chatSettings.responseMode) && (
											<span id="response-mode-normal">
												Balanced, conversational responses
											</span>
										)}
									</div>
								</div>

								<div>
									<div className="flex justify-between items-center">
										<label
											htmlFor="temperature"
											className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Temperature
										</label>
										<div className="flex items-center gap-2">
											<span
												className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
												aria-live="polite"
											>
												{chatSettings.temperature ?? 1}
											</span>
										</div>
									</div>
									<div className="relative mt-2">
										<input
											id="temperature"
											type="range"
											min="0"
											max="2"
											step="0.1"
											value={chatSettings.temperature ?? 1}
											onChange={(e) =>
												handleSettingChange("temperature", e.target.value)
											}
											className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
											aria-valuemin={0}
											aria-valuemax={2}
											aria-valuenow={chatSettings.temperature ?? 1}
											aria-valuetext={`Temperature: ${chatSettings.temperature ?? 1}`}
											aria-describedby="temperature-description"
										/>
										<div
											className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
											style={{
												width: `${((chatSettings.temperature ?? 1) / 2) * 100}%`,
											}}
											aria-hidden="true"
										/>
									</div>
									<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
										<span>Precise</span>
										<span>Neutral</span>
										<span>Creative</span>
									</div>
								</div>
								<div>
									<div className="flex items-center justify-between">
										<label
											htmlFor="use_rag"
											className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Enable RAG
										</label>
										<input
											id="use_rag"
											type="checkbox"
											checked={chatSettings.useRAG ?? false}
											onChange={(e) =>
												handleSettingChange("useRAG", e.target.checked)
											}
											className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
											aria-describedby="rag-description"
										/>
									</div>
									<p id="rag-description" className="sr-only">
										RAG stands for Retrieval-Augmented Generation, which
										enhances the model with external data.
									</p>
								</div>
								<div>
									<details className="mt-2">
										<summary className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
											What do these settings mean?
										</summary>
										<div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
											<p>
												<strong>Temperature:</strong> Controls randomness in
												responses. Lower values (0) make responses more
												deterministic and focused, while higher values (2) make
												responses more random and creative.
											</p>
										</div>
									</details>
								</div>
							</div>
						)}

						{activeTab === "advanced" && (
							<div className="space-y-6">
								<div>
									<div className="flex justify-between items-center">
										<label
											htmlFor="top_p"
											className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Top P
										</label>
										<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
											{chatSettings.top_p ?? 1}
										</span>
									</div>
									<div className="relative mt-2">
										<input
											id="top_p"
											type="range"
											min="0"
											max="1"
											step="0.05"
											value={chatSettings.top_p ?? 1}
											onChange={(e) =>
												handleSettingChange("top_p", e.target.value)
											}
											className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
											aria-valuemin={0}
											aria-valuemax={1}
											aria-valuenow={chatSettings.top_p ?? 1}
											aria-valuetext={`Top P: ${chatSettings.top_p ?? 1}`}
										/>
										<div
											className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
											style={{
												width: `${(chatSettings.top_p ?? 1) * 100}%`,
											}}
											aria-hidden="true"
										/>
									</div>
								</div>

								<div>
									<label
										htmlFor="max_tokens"
										className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
									>
										Max Tokens
									</label>
									<input
										id="max_tokens"
										type="number"
										min="1"
										max="4096"
										value={chatSettings.max_tokens ?? 2048}
										onChange={(e) =>
											handleSettingChange("max_tokens", e.target.value)
										}
										className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 mt-1"
										aria-valuemin={1}
										aria-valuemax={4096}
										aria-valuenow={chatSettings.max_tokens ?? 2048}
									/>
								</div>

								<div>
									<div className="flex justify-between items-center">
										<label
											htmlFor="presence_penalty"
											className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Presence Penalty
										</label>
										<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
											{chatSettings.presence_penalty ?? 0}
										</span>
									</div>
									<div className="relative mt-2">
										<input
											id="presence_penalty"
											type="range"
											min="-2"
											max="2"
											step="0.1"
											value={chatSettings.presence_penalty ?? 0}
											onChange={(e) =>
												handleSettingChange("presence_penalty", e.target.value)
											}
											className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
											aria-valuemin={-2}
											aria-valuemax={2}
											aria-valuenow={chatSettings.presence_penalty ?? 0}
											aria-valuetext={`Presence Penalty: ${chatSettings.presence_penalty ?? 0}`}
										/>
										<div
											className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
											style={{
												width: `${(((chatSettings.presence_penalty ?? 0) + 2) / 4) * 100}%`,
											}}
											aria-hidden="true"
										/>
									</div>
									<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
										<span>-2</span>
										<span>0</span>
										<span>+2</span>
									</div>
								</div>

								<div>
									<div className="flex justify-between items-center">
										<label
											htmlFor="frequency_penalty"
											className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Frequency Penalty
										</label>
										<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
											{chatSettings.frequency_penalty ?? 0}
										</span>
									</div>
									<div className="relative mt-2">
										<input
											id="frequency_penalty"
											type="range"
											min="-2"
											max="2"
											step="0.1"
											value={chatSettings.frequency_penalty ?? 0}
											onChange={(e) =>
												handleSettingChange("frequency_penalty", e.target.value)
											}
											className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
											aria-valuemin={-2}
											aria-valuemax={2}
											aria-valuenow={chatSettings.frequency_penalty ?? 0}
											aria-valuetext={`Frequency Penalty: ${chatSettings.frequency_penalty ?? 0}`}
										/>
										<div
											className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
											style={{
												width: `${(((chatSettings.frequency_penalty ?? 0) + 2) / 4) * 100}%`,
											}}
											aria-hidden="true"
										/>
									</div>
									<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
										<span>-2</span>
										<span>0</span>
										<span>+2</span>
									</div>
								</div>

								<details className="mt-2">
									<summary className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
										What do these settings mean?
									</summary>
									<div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 space-y-2">
										<p>
											<strong>Top P:</strong> Controls diversity via nucleus
											sampling. Lower values (0.1) make responses more focused,
											while higher values (1.0) make responses more diverse.
										</p>
										<p>
											<strong>Max Tokens:</strong> Limits the length of
											generated responses.
										</p>
										<p>
											<strong>Presence/Frequency Penalty:</strong> Controls
											repetition. Positive values reduce repetition, while
											negative values may increase it.
										</p>
									</div>
								</details>

								{chatSettings.useRAG && (
									<div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
										<h5 className="font-medium text-sm text-zinc-700 dark:text-zinc-300 mt-4">
											RAG Settings
										</h5>
										<div>
											<label
												htmlFor="rag_top_k"
												className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
											>
												Top K Results
											</label>
											<input
												id="rag_top_k"
												type="number"
												min="1"
												max="20"
												value={chatSettings.ragOptions?.topK ?? 3}
												onChange={(e) =>
													handleRagOptionChange("topK", e.target.value)
												}
												className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 mt-1"
												aria-valuemin={1}
												aria-valuemax={20}
												aria-valuenow={chatSettings.ragOptions?.topK ?? 3}
											/>
										</div>

										<div>
											<label
												htmlFor="rag_score_threshold"
												className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
											>
												Score Threshold
											</label>
											<div className="relative mt-2">
												<input
													id="rag_score_threshold"
													type="range"
													min="0"
													max="1"
													step="0.05"
													value={chatSettings.ragOptions?.scoreThreshold ?? 0.5}
													onChange={(e) =>
														handleRagOptionChange(
															"scoreThreshold",
															e.target.value,
														)
													}
													className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
													aria-valuemin={0}
													aria-valuemax={1}
													aria-valuenow={
														chatSettings.ragOptions?.scoreThreshold ?? 0.5
													}
													aria-valuetext={`Score Threshold: ${chatSettings.ragOptions?.scoreThreshold ?? 0.5}`}
												/>
												<div
													className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
													style={{
														width: `${(chatSettings.ragOptions?.scoreThreshold ?? 0.5) * 100}%`,
													}}
													aria-hidden="true"
												/>
											</div>
											<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
												<span>0</span>
												<span>0.5</span>
												<span>1</span>
											</div>
										</div>

										<div>
											<div className="flex items-center justify-between">
												<label
													htmlFor="rag_include_metadata"
													className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
												>
													Include Metadata
												</label>
												<input
													id="rag_include_metadata"
													type="checkbox"
													checked={
														chatSettings.ragOptions?.includeMetadata ?? false
													}
													onChange={(e) =>
														handleRagOptionChange(
															"includeMetadata",
															e.target.checked,
														)
													}
													className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
													aria-describedby="metadata-description"
												/>
											</div>
											<p id="metadata-description" className="sr-only">
												Include additional information about the retrieved
												documents.
											</p>
										</div>

										<div>
											<label
												htmlFor="rag_namespace"
												className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
											>
												Namespace
											</label>
											<input
												id="rag_namespace"
												type="text"
												value={chatSettings.ragOptions?.namespace ?? ""}
												onChange={(e) =>
													handleRagOptionChange("namespace", e.target.value)
												}
												className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 mt-1"
												placeholder="e.g., docs, knowledge-base"
												aria-describedby="namespace-description"
											/>
											<p id="namespace-description" className="sr-only">
												Specify a namespace to restrict document retrieval to a
												specific collection.
											</p>
										</div>
									</div>
								)}
							</div>
						)}

						<div className="flex justify-end space-x-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
							<Button
								type="button"
								variant="secondary"
								onClick={closeDialog}
								className="px-4 py-2 text-sm font-medium rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
							>
								Close
							</Button>
						</div>
					</div>
				</div>
			</dialog>
		</div>
	);
};
