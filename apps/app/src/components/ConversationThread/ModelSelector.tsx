import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import {
	type FC,
	type KeyboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";

import { useModels } from "~/hooks/useModels";
import {
	getAvailableModels,
	getFeaturedModelIds,
	getModelsByMode,
} from "~/lib/models";
import { useLoading } from "~/state/contexts/LoadingContext";
import { useChatStore } from "~/state/stores/chatStore";
import type { ChatMode, ModelConfigItem } from "~/types";

interface ModelSelectorProps {
	mode: ChatMode;
	model: string;
	onModelChange: (model: string) => void;
	isDisabled?: boolean;
}

export const ModelSelector: FC<ModelSelectorProps> = ({
	mode,
	model,
	onModelChange,
	isDisabled,
}) => {
	const { isPro } = useChatStore();
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showAllModels, setShowAllModels] = useState(false);
	const [selectedCapability, setSelectedCapability] = useState<string | null>(
		null,
	);
	const [activeDescendantId, setActiveDescendantId] = useState<string | null>(
		null,
	);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const listboxRef = useRef<HTMLDivElement>(null);

	const { data: apiModels = {}, isLoading: isLoadingModels } = useModels();
	const { isLoading, getProgress, getMessage } = useLoading();

	const availableModels = getAvailableModels(apiModels);
	const featuredModelIds = getFeaturedModelIds(availableModels);

	const filteredModels = getModelsByMode(availableModels, mode);

	useEffect(() => {
		if (searchQuery || selectedCapability) {
			setShowAllModels(true);
		}
	}, [searchQuery, selectedCapability]);

	const selectedModelInfo = filteredModels[model];
	const isModelLoading = isLoading("model-init");
	const modelLoadingProgress = getProgress("model-init");
	const modelLoadingMessage = getMessage("model-init");

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isOpen]);

	const featuredModels = Object.values(filteredModels).filter((model) => {
		return featuredModelIds[model.id];
	});

	const otherModels = Object.values(filteredModels).filter(
		(model) => !featuredModelIds[model.id],
	);

	const capabilities = Array.from(
		new Set(
			Object.values(filteredModels).flatMap((model) => model.strengths || []),
		),
	).sort();

	const filterModels = (models: ModelConfigItem[]) => {
		return models.filter((model) => {
			const matchesSearch =
				searchQuery === "" ||
				(
					model.name?.toLowerCase() || model.matchingModel.toLowerCase()
				).includes(searchQuery.toLowerCase()) ||
				(model.description?.toLowerCase() || "").includes(
					searchQuery.toLowerCase(),
				);

			const matchesCapability =
				!selectedCapability ||
				model.strengths?.includes(selectedCapability) ||
				false;

			return matchesSearch && matchesCapability;
		});
	};

	const filteredFeaturedModels = filterModels(featuredModels);
	const filteredOtherModels = filterModels(otherModels);

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			setIsOpen(false);
			return;
		}

		if (!isOpen) return;

		const allVisibleModels = [
			...filteredFeaturedModels,
			...(showAllModels ? filteredOtherModels : []),
		];
		const currentIndex = activeDescendantId
			? allVisibleModels.findIndex(
					(m) => `model-${m.matchingModel}` === activeDescendantId,
				)
			: -1;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				if (currentIndex < allVisibleModels.length - 1) {
					setActiveDescendantId(
						`model-${allVisibleModels[currentIndex + 1].matchingModel}`,
					);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (currentIndex > 0) {
					setActiveDescendantId(
						`model-${allVisibleModels[currentIndex - 1].matchingModel}`,
					);
				}
				break;
			case "Enter":
				e.preventDefault();
				if (activeDescendantId) {
					const selectedModel = allVisibleModels.find(
						(m) => `model-${m.matchingModel}` === activeDescendantId,
					);
					if (selectedModel) {
						onModelChange(selectedModel.id);
						setIsOpen(false);
					}
				}
				break;
		}
	};

	if (isLoadingModels) {
		return (
			<div className="flex items-center gap-2 text-sm text-zinc-500">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading models...
			</div>
		);
	}

	return (
		<div
			className="flex-1 relative"
			ref={dropdownRef}
			onKeyDown={handleKeyDown}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				disabled={isDisabled}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				aria-label="Select a model"
				className="cursor-pointer w-full max-w-[300px] px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center gap-2 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isModelLoading ? (
					<div className="flex items-center gap-2 text-sm text-zinc-500 w-full">
						<Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
						<span className="truncate flex-1">
							{modelLoadingMessage}{" "}
							{modelLoadingProgress !== undefined &&
								`(${modelLoadingProgress}%)`}
						</span>
					</div>
				) : (
					<>
						<span className="truncate flex-1 text-left">
							{selectedModelInfo?.name || "Select a model"}
						</span>
						{isOpen ? (
							<ChevronUp className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
						) : (
							<ChevronDown
								className="h-4 w-4 flex-shrink-0"
								aria-hidden="true"
							/>
						)}
					</>
				)}
			</button>

			{isOpen && (
				<dialog
					open
					className="absolute bottom-full left-0 mb-1 w-[350px] bg-off-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-50"
					aria-label="Model selection dialog"
				>
					<div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
						<div className="flex items-center gap-2">
							<div className="relative flex-1">
								<Search
									className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
									aria-hidden="true"
								/>
								<input
									ref={searchInputRef}
									type="text"
									placeholder="Search models..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
									aria-label="Search models"
									role="searchbox"
								/>
							</div>
							<select
								value={selectedCapability || ""}
								onChange={(e) => setSelectedCapability(e.target.value || null)}
								className="px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
								aria-label="Filter by capability"
							>
								<option value="">All capabilities</option>
								{capabilities.map((capability) => (
									<option key={capability} value={capability}>
										{capability}
									</option>
								))}
							</select>
						</div>
					</div>

					<div
						className="max-h-[300px] overflow-y-auto"
						ref={listboxRef}
						// biome-ignore lint/a11y/useSemanticElements: This is a fancy UI
						role="listbox"
						aria-label="Available models"
						aria-activedescendant={activeDescendantId || undefined}
						tabIndex={0}
					>
						{filteredFeaturedModels.length <= 0 &&
							filteredOtherModels.length <= 0 && (
								<div className="p-2 text-center text-sm text-zinc-500">
									No models found
								</div>
							)}

						{filteredFeaturedModels.length > 0 && (
							<div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
								<h3
									className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
									id="featured-models-heading"
								>
									Featured Models
								</h3>
								<fieldset aria-labelledby="featured-models-heading">
									{filteredFeaturedModels.map((model) => {
										const shouldModelBeDisabled =
											isDisabled || (!isPro && model.isFree !== true);

										return (
											<ModelOption
												key={model.matchingModel}
												model={model}
												isSelected={
													model.matchingModel ===
													selectedModelInfo?.matchingModel
												}
												onClick={() => {
													if (!shouldModelBeDisabled) {
														onModelChange(model.id);
														setIsOpen(false);
													}
												}}
												disabled={shouldModelBeDisabled}
												isActive={
													`model-${model.matchingModel}` === activeDescendantId
												}
											/>
										);
									})}
								</fieldset>
							</div>
						)}

						{filteredOtherModels.length > 0 && (
							<div className="p-2">
								<button
									type="button"
									onClick={() => setShowAllModels(!showAllModels)}
									className="cursor-pointer flex items-center justify-between w-full text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
									disabled={!!(searchQuery || selectedCapability)}
									aria-expanded={showAllModels}
									aria-controls="other-models-section"
								>
									<span>
										Other Models{" "}
										{filteredOtherModels.length > 0 &&
											`(${filteredOtherModels.length})`}
									</span>
									{showAllModels ? (
										<ChevronUp className="h-4 w-4" aria-hidden="true" />
									) : (
										<ChevronDown className="h-4 w-4" aria-hidden="true" />
									)}
								</button>

								<fieldset id="other-models-section" aria-label="Other models">
									{(showAllModels || searchQuery || selectedCapability) &&
										filteredOtherModels.map((model) => {
											const shouldModelBeDisabled =
												isDisabled || (!isPro && !model.isFree);

											return (
												<ModelOption
													key={model.matchingModel}
													model={model}
													isSelected={
														model.matchingModel ===
														selectedModelInfo?.matchingModel
													}
													onClick={() => {
														if (!shouldModelBeDisabled) {
															onModelChange(model.id);
															setIsOpen(false);
														}
													}}
													disabled={shouldModelBeDisabled}
													isActive={
														`model-${model.matchingModel}` ===
														activeDescendantId
													}
												/>
											);
										})}
								</fieldset>
							</div>
						)}
					</div>
				</dialog>
			)}
		</div>
	);
};

interface ModelOptionProps {
	model: ModelConfigItem;
	isSelected: boolean;
	isActive: boolean;
	onClick: () => void;
	disabled?: boolean;
}

const ModelOption: FC<ModelOptionProps> = ({
	model,
	isSelected,
	isActive,
	onClick,
	disabled,
}) => {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			// biome-ignore lint/a11y/useSemanticElements: This is a fancy UI
			role="option"
			aria-selected={isSelected}
			id={`model-${model.matchingModel}`}
			className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 w-full text-left px-3 py-2 rounded-md text-sm ${
				isSelected
					? "bg-off-white-highlight dark:bg-zinc-800"
					: isActive
						? "bg-zinc-50 dark:bg-zinc-800/50"
						: "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
			}`}
		>
			<div className="font-medium text-zinc-900 dark:text-zinc-100">
				{model.name || model.matchingModel}
				{!model.isFree && (
					<span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
						Pro
					</span>
				)}
			</div>
			{model.description && (
				<div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
					{model.description}
				</div>
			)}
			{model.strengths && (
				<div className="mt-1 flex flex-wrap gap-1">
					{model.strengths?.map((capability) => (
						<span
							key={`${model.matchingModel}-${capability}`}
							className="text-xs bg-off-white-highlight dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded"
						>
							{capability}
						</span>
					))}
				</div>
			)}
		</button>
	);
};
