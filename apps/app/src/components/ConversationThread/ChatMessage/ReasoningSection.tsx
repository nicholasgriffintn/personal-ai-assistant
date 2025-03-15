import { ChevronDown, ChevronRight } from "lucide-react";
import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReasoningSectionProps {
	reasoning: {
		content: string;
		collapsed: boolean;
	};
	index: number;
	setShowMessageReasoning: (index: number, showReasoning: boolean) => void;
}

export const ReasoningSection: FC<ReasoningSectionProps> = ({
	reasoning,
	index,
	setShowMessageReasoning,
}) => {
	return (
		<div className="mb-2">
			<button
				type="button"
				onClick={() => {
					setShowMessageReasoning(index, reasoning.collapsed);
				}}
				className="cursor-pointer flex items-center text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
				aria-label="Toggle reasoning"
			>
				{!reasoning.collapsed ? (
					<ChevronDown size={16} />
				) : (
					<ChevronRight size={16} />
				)}
				<span>Reasoning</span>
			</button>
			{!reasoning.collapsed && (
				<div>
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						className="prose dark:prose-invert prose-zinc prose-xs text-xs text-zinc-500 dark:text-zinc-400 mt-1"
						components={{
							table: ({ children }) => (
								<div className="overflow-x-scroll text-sm">{children}</div>
							),
						}}
					>
						{reasoning.content}
					</ReactMarkdown>
				</div>
			)}
		</div>
	);
};
