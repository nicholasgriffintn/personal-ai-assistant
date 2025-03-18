import { ArrowRight } from "lucide-react";

export function WebSearchView({ data }: { data: any }) {
	if (!data || !data.data) {
		return <p className="text-red-500">No search data available</p>;
	}

	const { answer, sources, similarQuestions } = data.data;

	const getDomain = (url: string) => {
		try {
			return url.replace(/(https?:\/\/)?(www\.)?/i, "").split("/")[0];
		} catch (e) {
			return url;
		}
	};

	return (
		<div className="max-w-full overflow-x-hidden">
			<div className="mb-6">
				<div className="flex items-center text-sm mb-2 text-zinc-600 dark:text-zinc-300">
					<ArrowRight className="h-5 w-5 mr-2" aria-hidden="true" />
					<span>{sources?.length || 0} sources</span>
				</div>

				<div className="flex flex-wrap gap-2 mb-4">
					{sources?.slice(0, 3).map((source: any) => (
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

					{sources?.length > 3 && (
						<div className="flex items-center justify-center min-w-[100px] p-3 border border-gray-700 rounded-md">
							<span className="text-zinc-600 dark:text-zinc-300">
								+{sources.length - 3} sources
							</span>
						</div>
					)}
				</div>
			</div>

			<div className="mb-6 text-zinc-600 dark:text-zinc-300">
				<p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
					{answer}
				</p>
			</div>

			{similarQuestions && similarQuestions.length > 0 && (
				<div className="mt-8">
					<h2 className="text-xl font-medium mb-4 text-zinc-600 dark:text-zinc-300">
						People also ask
					</h2>
					<div className="space-y-0">
						{similarQuestions.map((question: string, index: number) => (
							<div
								key={`question-${question}`}
								className={`border-t border-gray-700 py-4 ${index === similarQuestions.length - 1 ? "border-b" : ""}`}
							>
								<div className="flex justify-between items-center">
									<p className="text-zinc-600 dark:text-zinc-300">{question}</p>
									{/* TODO: Add a button to use this question as a new prompt */}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
