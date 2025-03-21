import { memo } from "react";
import { MemoizedMarkdown } from "~/components/ui/Markdown";

export interface ArtifactProps {
	identifier: string;
	type: string;
	language?: string;
	title?: string;
	content: string;
}

export const ArtifactComponent = memo(
	({ identifier, type, language, title, content }: ArtifactProps) => {
		return (
			<div className="artifact-container border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 my-4">
				<div className="artifact-header flex justify-between items-center mb-2">
					<h3 className="text-md font-medium">{title || "Artifact"}</h3>
					<div className="artifact-meta text-xs text-zinc-500">
						{language && <span className="mr-2">{language}</span>}
						<span>{identifier}</span>
					</div>
				</div>
				<div className="artifact-content">
					{type.includes("code") ? (
						<div className="bg-zinc-100 dark:bg-zinc-800 rounded p-3 overflow-x-auto">
							<pre>
								<code className={language ? `language-${language}` : ""}>
									{content}
								</code>
							</pre>
						</div>
					) : (
						<MemoizedMarkdown>{content}</MemoizedMarkdown>
					)}
				</div>
			</div>
		);
	},
);
