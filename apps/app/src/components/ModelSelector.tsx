import { useState, useRef, useEffect, type FC } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

import { modelsOptions, getAvailableModels } from "../lib/models";
import type { ChatMode } from "../types";

interface ModelSelectorProps {
  mode: ChatMode;
  model: string;
  onModelChange: (model: string) => void;
  hasApiKey: boolean;
  isDisabled?: boolean;
}

export const ModelSelector: FC<ModelSelectorProps> = ({
  mode,
  model,
  onModelChange,
  hasApiKey,
  isDisabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllModels, setShowAllModels] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery || selectedCapability) {
      setShowAllModels(true);
    }
  }, [searchQuery, selectedCapability]);

  const availableModels = getAvailableModels(hasApiKey).filter((model) =>
    mode === "local" ? model.isLocal : !model.isLocal
  );

  const selectedModelInfo = modelsOptions.find((m) => m.id === model);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const featuredModelIds = [
    "mistral-small",
    "mistral-large",
    "claude-3-7-sonnet",
    "gemini-2.0-flash",
    "gpt-4o",
  ];

  const featuredModels = availableModels.filter((model) =>
    featuredModelIds.includes(model.id)
  );

  const otherModels = availableModels.filter(
    (model) => !featuredModelIds.includes(model.id)
  );

  const capabilities = Array.from(
    new Set(
      availableModels.flatMap((model) => model.capabilities || [])
    )
  ).sort();

  const filterModels = (models: typeof availableModels) => {
    return models.filter((model) => {
      const matchesSearch =
        searchQuery === "" ||
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesCapability =
        !selectedCapability ||
        model.capabilities?.includes(selectedCapability);

      return matchesSearch && matchesCapability;
    });
  };

  const filteredFeaturedModels = filterModels(featuredModels);
  const filteredOtherModels = filterModels(otherModels);

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center gap-2 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate flex-1 text-left">
          {selectedModelInfo?.name || "Select a model"}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-[350px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <select
                value={selectedCapability || ""}
                onChange={(e) => setSelectedCapability(e.target.value || null)}
                className="px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
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

          <div className="max-h-[300px] overflow-y-auto">
            <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Featured Models</h3>
              {filteredFeaturedModels.map((model) => (
                <ModelOption
                  key={model.id}
                  model={model}
                  isSelected={model.id === selectedModelInfo?.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  disabled={isDisabled}
                />
              ))}
            </div>

            {filteredOtherModels.length > 0 && (
              <div className="p-2">
                <button
                  onClick={() => setShowAllModels(!showAllModels)}
                  className="flex items-center justify-between w-full text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                  disabled={!!(searchQuery || selectedCapability)}
                >
                  <span>Other Models {filteredOtherModels.length > 0 && `(${filteredOtherModels.length})`}</span>
                  {showAllModels ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {(showAllModels || searchQuery || selectedCapability) && filteredOtherModels.map((model) => (
                  <ModelOption
                    key={model.id}
                    model={model}
                    isSelected={model.id === selectedModelInfo?.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    disabled={isDisabled || (!hasApiKey && !model.isFree)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ModelOptionProps {
  model: (typeof modelsOptions)[0];
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ModelOption: FC<ModelOptionProps> = ({
  model,
  isSelected,
  onClick,
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
        isSelected
          ? "bg-zinc-100 dark:bg-zinc-800"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="font-medium text-zinc-900 dark:text-zinc-100">
        {model.name}
        {!model.isFree && (
          <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
            Pro
          </span>
        )}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
        {model.description}
      </div>
      {model.capabilities && (
        <div className="mt-1 flex flex-wrap gap-1">
          {model.capabilities.map((capability) => (
            <span
              key={capability}
              className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded"
            >
              {capability}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}; 