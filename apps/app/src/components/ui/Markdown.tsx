import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export function Markdown({
	children,
	className,
}: { children: string; className?: string }) {
	return (
		<ReactMarkdown
			components={{
				code: ({ node, ...props }) => (
					<code {...props} className="bg-gray-100 dark:bg-gray-800 p-1 rounded">
						{props.children}
					</code>
				),
				table: ({ children }) => (
					<div className="overflow-x-scroll text-sm">{children}</div>
				),
			}}
			className={`prose dark:prose-invert prose-zinc ${className}`}
			rehypePlugins={[rehypeHighlight]}
			remarkPlugins={[remarkGfm]}
		>
			{children}
		</ReactMarkdown>
	);
}
