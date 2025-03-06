import { type FC, useState } from 'react';
import { Settings } from 'lucide-react';

import type { ChatSettings as ChatSettingsType } from '../types';

interface ChatSettingsProps {
	settings: ChatSettingsType;
	onSettingsChange: (settings: ChatSettingsType) => void;
	isDisabled?: boolean;
}

export const ChatSettings: FC<ChatSettingsProps> = ({ settings, onSettingsChange, isDisabled = false }) => {
	const [showSettings, setShowSettings] = useState(false);

	const handleSettingChange = (key: keyof ChatSettingsType, value: string | boolean) => {
		if (typeof value === 'string') {
			const numValue = Number.parseFloat(value);
			if (!Number.isNaN(numValue)) {
				onSettingsChange({
					...settings,
					[key]: numValue,
				});
			}
		} else {
			onSettingsChange({
				...settings,
				[key]: value,
			});
		}
	};

	const handleRagOptionChange = (key: keyof NonNullable<ChatSettingsType['ragOptions']>, value: string | boolean) => {
		if (typeof value === 'boolean') {
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
				onClick={() => setShowSettings(!showSettings)}
				className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400"
				disabled={isDisabled}
			>
				<Settings className="h-4 w-4" />
				<span className="sr-only">{showSettings ? 'Hide chat settings' : 'Show chat settings'}</span>
			</button>

			{showSettings && (
				<div className="absolute bottom-full mb-2 right-0 w-80 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
					<div className="space-y-4">
						<h4 className="font-medium text-zinc-900 dark:text-zinc-100 sticky top-0 bg-white dark:bg-zinc-900 py-2">Chat Settings</h4>

						<div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 -mr-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
							<div>
								<label htmlFor="responseMode" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									Response Mode
								</label>
								<select
									id="responseMode"
									value={settings.responseMode ?? 'normal'}
									onChange={(e) => handleSettingChange('responseMode', e.target.value)}
									disabled={isDisabled}
									className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
								>
									<option value="normal">Normal</option>
									<option value="concise">Concise</option>
									<option value="explanatory">Explanatory</option>
									<option value="formal">Formal</option>
								</select>
								<div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
									{settings.responseMode === 'concise' && 'Brief, to-the-point responses'}
									{settings.responseMode === 'explanatory' && 'Detailed explanations with examples'}
									{settings.responseMode === 'formal' && 'Professional, structured responses'}
									{(settings.responseMode === 'normal' || !settings.responseMode) && 'Balanced, conversational responses'}
								</div>
							</div>

							<div>
								<label htmlFor="temperature" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									Temperature (0-2)
								</label>
								<input
									id="temperature"
									type="range"
									min="0"
									max="2"
									step="0.1"
									value={settings.temperature ?? 1}
									onChange={(e) => handleSettingChange('temperature', e.target.value)}
									className="w-full"
								/>
								<div className="text-xs text-zinc-600 dark:text-zinc-400">Current: {settings.temperature ?? 1}</div>
							</div>

							<div>
								<label htmlFor="top_p" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									Top P (0-1)
								</label>
								<input
									id="top_p"
									type="range"
									min="0"
									max="1"
									step="0.05"
									value={settings.top_p ?? 1}
									onChange={(e) => handleSettingChange('top_p', e.target.value)}
									className="w-full"
								/>
								<div className="text-xs text-zinc-600 dark:text-zinc-400">Current: {settings.top_p ?? 1}</div>
							</div>

							<div>
								<label htmlFor="max_tokens" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									Max Tokens
								</label>
								<input
									id="max_tokens"
									type="number"
									min="1"
									max="4096"
									value={settings.max_tokens ?? 2048}
									onChange={(e) => handleSettingChange('max_tokens', e.target.value)}
									className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
								/>
							</div>

							<div>
								<label htmlFor="presence_penalty" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									Presence Penalty (-2 to 2)
								</label>
								<input
									id="presence_penalty"
									type="range"
									min="-2"
									max="2"
									step="0.1"
									value={settings.presence_penalty ?? 0}
									onChange={(e) => handleSettingChange('presence_penalty', e.target.value)}
									className="w-full"
								/>
								<div className="text-xs text-zinc-600 dark:text-zinc-400">Current: {settings.presence_penalty ?? 0}</div>
							</div>

							<div>
								<label htmlFor="frequency_penalty" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
									Frequency Penalty (-2 to 2)
								</label>
								<input
									id="frequency_penalty"
									type="range"
									min="-2"
									max="2"
									step="0.1"
									value={settings.frequency_penalty ?? 0}
									onChange={(e) => handleSettingChange('frequency_penalty', e.target.value)}
									className="w-full"
								/>
								<div className="text-xs text-zinc-600 dark:text-zinc-400">Current: {settings.frequency_penalty ?? 0}</div>
							</div>

							<div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
								<div className="flex items-center justify-between">
									<label htmlFor="use_rag" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
										Enable RAG
									</label>
									<input
										id="use_rag"
										type="checkbox"
										checked={settings.useRAG ?? false}
										onChange={(e) => handleSettingChange('useRAG', e.target.checked)}
										className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
									/>
								</div>
							</div>

							{settings.useRAG && (
								<div className="space-y-3 pt-2">
									<div>
										<label htmlFor="rag_top_k" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
											Top K Results
										</label>
										<input
											id="rag_top_k"
											type="number"
											min="1"
											max="20"
											value={settings.ragOptions?.topK ?? 3}
											onChange={(e) => handleRagOptionChange('topK', e.target.value)}
											className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
										/>
									</div>

									<div>
										<label htmlFor="rag_score_threshold" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
											Score Threshold
										</label>
										<input
											id="rag_score_threshold"
											type="range"
											min="0"
											max="1"
											step="0.05"
											value={settings.ragOptions?.scoreThreshold ?? 0.5}
											onChange={(e) => handleRagOptionChange('scoreThreshold', e.target.value)}
											className="w-full"
										/>
										<div className="text-xs text-zinc-600 dark:text-zinc-400">Current: {settings.ragOptions?.scoreThreshold ?? 0.5}</div>
									</div>

									<div>
										<label htmlFor="rag_include_metadata" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
											Include Metadata
										</label>
										<input
											id="rag_include_metadata"
											type="checkbox"
											checked={settings.ragOptions?.includeMetadata ?? false}
											onChange={(e) => handleRagOptionChange('includeMetadata', e.target.checked)}
											className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500"
										/>
									</div>

									<div>
										<label htmlFor="rag_namespace" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
											Namespace
										</label>
										<input
											id="rag_namespace"
											type="text"
											value={settings.ragOptions?.namespace ?? ''}
											onChange={(e) => handleRagOptionChange('namespace', e.target.value)}
											className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
											placeholder="e.g., docs, knowledge-base"
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
