import type { FC } from "react";

import type { AppSchema } from "../../../lib/api/dynamic-apps";
import CustomView from "./CustomView";
import JsonView from "./JsonView";
import TableView from "./TableView";
import TextView from "./TextView";

interface ResponseRendererProps {
	app: AppSchema;
	result: Record<string, any>;
	onReset: () => void;
}

const ResponseRenderer: FC<ResponseRendererProps> = ({
	app,
	result,
	onReset,
}) => {
	const renderResponse = () => {
		const { type } = app.responseSchema;
		const responseData = result.data?.result || {};

		switch (type) {
			case "table":
				return <TableView data={responseData} />;

			case "json":
				return <JsonView data={responseData} />;

			case "text":
				return <TextView data={responseData} />;

			case "custom":
				return (
					<CustomView
						template={app.responseSchema.display.template}
						data={responseData}
					/>
				);

			default:
				return (
					<div className="p-4 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
						Unsupported response type: {type}
					</div>
				);
		}
	};

	return (
		<div className="max-w-3xl mx-auto">
			<div className="mb-8">
				<h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
					{app.name} - Results
				</h1>
				<p className="text-zinc-600 dark:text-zinc-300">
					{result.data?.message || `Results for ${app.name}`}
				</p>
				{result.data?.timestamp && (
					<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
						Generated on: {new Date(result.data.timestamp).toLocaleString()}
					</p>
				)}
			</div>

			<div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 rounded-lg shadow-sm mb-6">
				{renderResponse()}
			</div>

			<div className="flex justify-between">
				<button
					type="button"
					onClick={onReset}
					className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-md"
				>
					Start Over
				</button>
			</div>
		</div>
	);
};

export default ResponseRenderer;
