import { ArrowRight } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export function TutorView({ data }: { data: any }) {
	const [showAllSources, setShowAllSources] = useState(false);

	if (!data) {
		return <p className="text-red-500">No tutor data available</p>;
	}

	const { answer, sources, completion_id } = data;

	const getDomain = (url: string) => {
		try {
			return url.replace(/(https?:\/\/)?(www\.)?/i, "").split("/")[0];
		} catch (e) {
			return url;
		}
	};

	const handleToggleSources = () => {
		setShowAllSources(!showAllSources);
	};

	const displayedSources = showAllSources ? sources : sources?.slice(0, 3);

	return (
		<div className="max-w-full overflow-x-hidden">
			<div className="mb-6">
				<div className="flex items-center text-sm mb-2 text-zinc-600 dark:text-zinc-300">
					<ArrowRight className="h-5 w-5 mr-2" aria-hidden="true" />
					<span>{sources?.length || 0} sources</span>
				</div>

				<div className="flex flex-wrap gap-2 mb-4">
					{displayedSources?.map((source: any) => (
						<a
							key={`source-card-${source.url}`}
							href={source.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 min-w-[150px] border border-gray-700 rounded-md p-3 hover:bg-gray-800 transition-colors"
						>
							<div className="flex items-center mb-2">
								<img
									src={`https://www.google.com/s2/favicons?domain=${source.url}&sz=128`}
									alt={`${getDomain(source.url)} favicon`}
									className="w-6 h-6 rounded-full mr-2 bg-white object-contain p-[2px]"
									onError={(e) => {
										const target = e.target as HTMLImageElement;
										target.style.display = "none";
									}}
								/>
								<div className="text-xs text-zinc-600 dark:text-zinc-300 truncate">
									{getDomain(source.url)}
								</div>
							</div>
							<p className="text-sm font-medium line-clamp-2 text-zinc-600 dark:text-zinc-300">
								{source.title}
							</p>
						</a>
					))}

					{!showAllSources && sources?.length > 3 && (
						<button
							type="button"
							onClick={handleToggleSources}
							className="flex items-center justify-center min-w-[100px] p-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
						>
							<span className="text-zinc-600 dark:text-zinc-300">
								+{sources.length - 3} sources
							</span>
						</button>
					)}

					{showAllSources && sources?.length > 3 && (
						<button
							type="button"
							onClick={handleToggleSources}
							className="flex items-center justify-center min-w-[100px] p-3 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
						>
							<span className="text-zinc-600 dark:text-zinc-300">
								Show less
							</span>
						</button>
					)}
				</div>
			</div>

			<div className="mb-6 text-zinc-600 dark:text-zinc-300">
				<p className="prose dark:prose-invert text-zinc-600 dark:text-zinc-300">
					<ReactMarkdown
						components={{
							code: ({ node, ...props }) => (
								<code
									{...props}
									className="bg-gray-100 dark:bg-gray-800 p-1 rounded"
								>
									{props.children}
								</code>
							),
						}}
						rehypePlugins={[rehypeHighlight]}
						remarkPlugins={[remarkGfm]}
					>
						{answer}
					</ReactMarkdown>
				</p>
			</div>

			{completion_id && (
				<div className="mt-8">
					<button
						type="button"
						className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
						onClick={() => {
							window.open(`/?completion_id=${completion_id}`, "_blank");
						}}
					>
						Continue the conversation
					</button>
				</div>
			)}
		</div>
	);
}
