import { Code2, FileText } from "lucide-react";
import { memo } from "react";

export interface ArtifactProps {
	identifier: string;
	type: string;
	language?: string;
	title?: string;
	content: string;
	onOpen?: (artifact: ArtifactProps) => void;
}

export const ArtifactComponent = memo(
	({ identifier, type, language, title, content, onOpen }: ArtifactProps) => {
		const handleClick = () => {
			if (onOpen) {
				onOpen({ identifier, type, language, title, content });
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleClick();
			}
		};

		const isCode = type.includes("code");
		const icon = isCode ? <Code2 size={16} /> : <FileText size={16} />;

		return (
			<button
				type="button"
				className="artifact-container w-full text-left border border-zinc-200 dark:border-zinc-700 rounded-md p-2 my-1 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer"
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				aria-label={`Open ${title || "artifact"}`}
			>
				<div className="flex items-start gap-2">
					<div className="flex-shrink-0 mt-1">{icon}</div>
					<div className="flex-grow min-w-0">
						<h3 className="text-sm font-medium truncate">
							{title || "Artifact"}
						</h3>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							Click here to open the {isCode ? "code" : "file"}
						</p>
					</div>
					{language && (
						<span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0 mr-1">
							{language}
						</span>
					)}
				</div>
			</button>
		);
	},
);
