import { CloudOff, Computer, Settings, Sparkles } from "lucide-react";
import { type FC, useEffect, useState } from "react";

import { useChatStore } from "~/state/stores/chatStore";
import type { ChatMode, ChatSettings as ChatSettingsType } from "~/types";

interface ChatSettingsProps {
	settings: ChatSettingsType;
	onSettingsChange: (settings: ChatSettingsType) => void;
	isDisabled?: boolean;
	mode: ChatMode;
	onModeChange: (mode: ChatMode) => void;
}

export const ChatSettings: FC<ChatSettingsProps> = ({
	settings,
	onSettingsChange,
	isDisabled = false,
	mode,
	onModeChange,
}) => {
	const { isPro, streamingEnabled, toggleStreaming } = useChatStore();
	const [showSettings, setShowSettings] = useState(false);
	const [promptCoach, setPromptCoach] = useState(mode === "prompt_coach");
	const [useLocalModel, setUseLocalModel] = useState(mode === "local");
	const [localOnly, setLocalOnly] = useState(settings.localOnly || false);

	useEffect(() => {
		setPromptCoach(mode === "prompt_coach");
		setUseLocalModel(mode === "local");
		setLocalOnly(settings.localOnly || false);
	}, [mode, settings.localOnly]);

	const handleEnableLocalModels = () => {
		const newValue = !useLocalModel;
		setUseLocalModel(newValue);
		onModeChange(newValue ? "local" : "remote");

		if (newValue) {
			setLocalOnly(true);
			onSettingsChange({
				...settings,
				localOnly: true,
			});
		}
	};

	const handleEnablePromptCoach = () => {
		if (useLocalModel) {
			setPromptCoach(false);
			return;
		}

		const newValue = !promptCoach;
		setPromptCoach(newValue);
		onModeChange(newValue ? "prompt_coach" : "remote");
	};

	const handleLocalOnlyToggle = () => {
		if (useLocalModel && localOnly) {
			return;
		}

		const newValue = !localOnly;
		setLocalOnly(newValue);
		onSettingsChange({
			...settings,
			localOnly: newValue,
		});
	};

	const handleSettingChange = (
		key: keyof ChatSettingsType,
		value: string | boolean,
	) => {
		if (typeof value === "string") {
			if (key === "responseMode") {
				onSettingsChange({
					...settings,
					[key]: value as ChatSettingsType["responseMode"],
				});
				return;
			}

			const numValue = Number.parseFloat(value);
			if (!Number.isNaN(numValue)) {
				onSettingsChange({
					...settings,
					[key]: numValue,
				});
				return;
			}

			onSettingsChange({
				...settings,
				[key]: value,
			});
		} else {
			onSettingsChange({
				...settings,
				[key]: value,
			});
		}
	};

	const handleRagOptionChange = (
		key: keyof NonNullable<ChatSettingsType["ragOptions"]>,
		value: string | boolean,
	) => {
		if (typeof value === "boolean") {
			onSettingsChange({
				...settings,
				ragOptions: {
					...settings.ragOptions,
					[key]: value,
				},
			});
			return;
		}

		const numValue = Number.parseFloat(value);
		onSettingsChange({
			...settings,
			ragOptions: {
				...settings.ragOptions,
				[key]: !Number.isNaN(numValue) ? numValue : value,
			},
		});
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={handleEnableLocalModels}
				className={`
					cursor-pointer p-2 hover:bg-off-white-highlight dark:hover:bg-zinc-900 rounded-lg
					${useLocalModel ? "bg-off-white-highlight dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}
				`}
				title={useLocalModel ? "Use Remote Models" : "Use Local Models"}
				aria-label={useLocalModel ? "Use Remote Models" : "Use Local Models"}
			>
				<Computer className="h-4 w-4" />
				<span className="sr-only">
					{useLocalModel ? "Use Local Models" : "Use Remote Models"}
				</span>
			</button>
			<button
				type="button"
				onClick={handleEnablePromptCoach}
				disabled={useLocalModel}
				className={`
					cursor-pointer p-2 hover:bg-off-white-highlight dark:hover:bg-zinc-900 rounded-lg
					${promptCoach ? "bg-off-white-highlight dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}
				`}
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
			>
				<Sparkles className="h-4 w-4" />
				<span className="sr-only">
					{promptCoach
						? "Disable Prompt Enhancement"
						: "Enable Prompt Enhancement"}
				</span>
			</button>

			{isPro && (
				<button
					type="button"
					onClick={handleLocalOnlyToggle}
					disabled={useLocalModel}
					className={`
						cursor-pointer p-2 hover:bg-off-white-highlight dark:hover:bg-zinc-900 rounded-lg
						${localOnly ? "bg-off-white-highlight dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}
						${useLocalModel ? "opacity-50 cursor-not-allowed" : ""}
					`}
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
				>
					<CloudOff className="h-4 w-4" />
					<span className="sr-only">
						{useLocalModel
							? "Local models are always stored locally"
							: localOnly
								? "Store on server"
								: "Local-only (not stored on server)"}
					</span>
				</button>
			)}

			<button
				type="button"
				onClick={() => setShowSettings(!showSettings)}
				className="cursor-pointer p-2 hover:bg-off-white-highlight dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400"
				disabled={isDisabled}
				title={showSettings ? "Hide chat settings" : "Show chat settings"}
				aria-label={showSettings ? "Hide chat settings" : "Show chat settings"}
			>
				<Settings className="h-4 w-4" />
				<span className="sr-only">
					{showSettings ? "Hide chat settings" : "Show chat settings"}
				</span>
			</button>

			{showSettings && (
				<div className="absolute bottom-full mb-2 right-0 w-80 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 shadow-lg">
					<div className="space-y-4">
						<h4 className="font-medium text-zinc-900 dark:text-zinc-100 sticky top-0 bg-off-white dark:bg-zinc-900 py-2 z-10">
							Chat Settings
						</h4>

						<div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 -mr-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
							<div>
								<label
									htmlFor="responseMode"
									className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
								>
									Response Mode
								</label>
								<select
									id="responseMode"
									value={settings.responseMode ?? "normal"}
									onChange={(e) =>
										handleSettingChange("responseMode", e.target.value)
									}
									disabled={isDisabled}
									className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
								>
									<option value="normal">Normal</option>
									<option value="concise">Concise</option>
									<option value="explanatory">Explanatory</option>
									<option value="formal">Formal</option>
								</select>
								<div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
									{settings.responseMode === "concise" &&
										"Brief, to-the-point responses"}
									{settings.responseMode === "explanatory" &&
										"Detailed explanations with examples"}
									{settings.responseMode === "formal" &&
										"Professional, structured responses"}
									{(settings.responseMode === "normal" ||
										!settings.responseMode) &&
										"Balanced, conversational responses"}
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
										<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
											{settings.temperature ?? 1}
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
										value={settings.temperature ?? 1}
										onChange={(e) =>
											handleSettingChange("temperature", e.target.value)
										}
										className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
									/>
									<div
										className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
										style={{
											width: `${((settings.temperature ?? 1) / 2) * 100}%`,
										}}
									/>
								</div>
								<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									<span>Precise</span>
									<span>Neutral</span>
									<span>Creative</span>
								</div>
								<details className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
									<summary>What does this mean?</summary>
									<div className="text-xs text-zinc-600 dark:text-zinc-400">
										<strong>Precise</strong>: More focused and concise
										responses, ideal for coding, math, and technical questions.
										<br />
										<strong>Neutral</strong>: Balanced responses, suitable for
										general conversations.
										<br />
										<strong>Creative</strong>: More imaginative and poetic
										responses, ideal for creative writing and poetry.
									</div>
								</details>
							</div>

							<div>
								<label
									htmlFor="top_p"
									className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
								>
									Top P
								</label>
								<div className="relative mt-2">
									<input
										id="top_p"
										type="range"
										min="0"
										max="1"
										step="0.05"
										value={settings.top_p ?? 1}
										onChange={(e) =>
											handleSettingChange("top_p", e.target.value)
										}
										className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
									/>
									<div
										className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
										style={{
											width: `${(settings.top_p ?? 1) * 100}%`,
										}}
									/>
								</div>
								<div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
									Current: {settings.top_p ?? 1}
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
									value={settings.max_tokens ?? 2048}
									onChange={(e) =>
										handleSettingChange("max_tokens", e.target.value)
									}
									className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
								/>
							</div>

							<div>
								<label
									htmlFor="presence_penalty"
									className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
								>
									Presence Penalty
								</label>
								<div className="relative mt-2">
									<input
										id="presence_penalty"
										type="range"
										min="-2"
										max="2"
										step="0.1"
										value={settings.presence_penalty ?? 0}
										onChange={(e) =>
											handleSettingChange("presence_penalty", e.target.value)
										}
										className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
									/>
									<div
										className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
										style={{
											width: `${(((settings.presence_penalty ?? 0) + 2) / 4) * 100}%`,
										}}
									/>
								</div>
								<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									<span>-2</span>
									<span>0</span>
									<span>+2</span>
								</div>
							</div>

							<div>
								<label
									htmlFor="frequency_penalty"
									className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
								>
									Frequency Penalty
								</label>
								<div className="relative mt-2">
									<input
										id="frequency_penalty"
										type="range"
										min="-2"
										max="2"
										step="0.1"
										value={settings.frequency_penalty ?? 0}
										onChange={(e) =>
											handleSettingChange("frequency_penalty", e.target.value)
										}
										className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
									/>
									<div
										className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
										style={{
											width: `${(((settings.frequency_penalty ?? 0) + 2) / 4) * 100}%`,
										}}
									/>
								</div>
								<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									<span>-2</span>
									<span>0</span>
									<span>+2</span>
								</div>
							</div>

							<div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
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
										checked={settings.useRAG ?? false}
										onChange={(e) =>
											handleSettingChange("useRAG", e.target.checked)
										}
										className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
									/>
								</div>
							</div>

							{settings.useRAG && (
								<div className="space-y-3 pt-2">
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
											value={settings.ragOptions?.topK ?? 3}
											onChange={(e) =>
												handleRagOptionChange("topK", e.target.value)
											}
											className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
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
												value={settings.ragOptions?.scoreThreshold ?? 0.5}
												onChange={(e) =>
													handleRagOptionChange(
														"scoreThreshold",
														e.target.value,
													)
												}
												className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200 dark:[&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-off-white [&::-webkit-slider-thumb]:shadow-md"
											/>
											<div
												className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-blue-500 pointer-events-none"
												style={{
													width: `${(settings.ragOptions?.scoreThreshold ?? 0.5) * 100}%`,
												}}
											/>
										</div>
										<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
											<span>0</span>
											<span>0.5</span>
											<span>1</span>
										</div>
									</div>

									<div>
										<label
											htmlFor="rag_include_metadata"
											className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
										>
											Include Metadata
										</label>
										<input
											id="rag_include_metadata"
											type="checkbox"
											checked={settings.ragOptions?.includeMetadata ?? false}
											onChange={(e) =>
												handleRagOptionChange(
													"includeMetadata",
													e.target.checked,
												)
											}
											className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
										/>
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
											value={settings.ragOptions?.namespace ?? ""}
											onChange={(e) =>
												handleRagOptionChange("namespace", e.target.value)
											}
											className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
											placeholder="e.g., docs, knowledge-base"
										/>
									</div>
								</div>
							)}
							<div className="flex items-center justify-between text-zinc-900 dark:text-zinc-100">
								<div className="flex flex-col gap-1">
									<div className="flex items-center gap-2">
										<h3 className="text-sm font-medium">Streaming Mode</h3>
										<span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800">
											Beta
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										Get responses as they're generated instead of waiting for
										completion. Currently in beta and only available for
										mistral, text models.
									</p>
								</div>
							</div>
							<div className="text-zinc-900 dark:text-zinc-100">
								<input
									type="checkbox"
									id="streaming-toggle"
									checked={streamingEnabled}
									onChange={toggleStreaming}
									className="mr-2"
								/>
								<label htmlFor="streaming-toggle" className="text-sm">
									Enable
								</label>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
