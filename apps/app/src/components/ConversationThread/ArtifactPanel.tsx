import { Code2, Copy, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";

import { MemoizedMarkdown } from "~/components/ui/Markdown";
import type { ArtifactProps } from "./ChatMessage/ArtifactComponent";

interface ArtifactPanelProps {
	artifact: ArtifactProps | null;
	onClose: () => void;
	isVisible: boolean;
}

export const ArtifactPanel = ({
	artifact,
	onClose,
	isVisible,
}: ArtifactPanelProps) => {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setCopied(false);
	}, []);

	if (!artifact) return null;

	const handleCopy = () => {
		if (artifact.content) {
			navigator.clipboard
				.writeText(artifact.content)
				.then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				})
				.catch((err) => console.error("Failed to copy content: ", err));
		}
	};

	const isCode = artifact.type.includes("code");
	const icon = isCode ? <Code2 size={20} /> : <FileText size={20} />;

	return (
		<div
			className={`
        absolute right-0 top-0 h-full 
        w-[90%] sm:w-[350px] md:w-[400px] lg:w-[650px] 
        bg-white dark:bg-zinc-800 
        border-l border-zinc-200 dark:border-zinc-700 
        shadow-xl z-50 
        transition-transform duration-300 ease-in-out 
        ${isVisible ? "translate-x-0" : "translate-x-full"}
      `}
			aria-labelledby="artifact-panel-title"
			aria-modal="true"
		>
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
					<div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 min-w-0 flex-1 overflow-hidden">
						{icon}
						<h3
							id="artifact-panel-title"
							className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 truncate"
						>
							{artifact.title || "Artifact"}
						</h3>
					</div>
					<div className="flex gap-2 flex-shrink-0 ml-2">
						<button
							type="button"
							onClick={handleCopy}
							className="p-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
							title={copied ? "Copied!" : "Copy content"}
							aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
						>
							<Copy size={16} className={copied ? "text-green-500" : ""} />
						</button>
						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
							title="Close panel"
							aria-label="Close panel"
						>
							<X size={16} />
						</button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
					<div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
						{artifact.language && (
							<span className="mr-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300">
								{artifact.language}
							</span>
						)}
						<span className="font-medium">{artifact.identifier}</span>
					</div>
					<div className="artifact-content-full">
						<div className="prose dark:prose-invert max-w-none">
							<MemoizedMarkdown>
								{`\`\`\`${artifact.language}\n${artifact.content}\n\`\`\``}
							</MemoizedMarkdown>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
