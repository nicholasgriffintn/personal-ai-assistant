import type { FC } from "react";

import type { AppSchema } from "~/lib/api/dynamic-apps";
import { getCardGradient, styles } from "../utils";
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
			<div
				className={`${styles.card} bg-gradient-to-br ${getCardGradient(app.icon)} mb-6`}
			>
				<div className="mb-6">
					<div className="flex items-center space-x-4 mb-4">
						<div className={styles.iconContainer}>
							{styles.getIcon(app.icon)}
						</div>
						<div>
							<h1 className={styles.heading}>{app.name} - Results</h1>
							<p className={styles.paragraph}>
								{result.data?.message || `Results for ${app.name}`}
							</p>
							{result.data?.timestamp && (
								<p className={`${styles.smallText} mt-1`}>
									Generated on:{" "}
									{new Date(result.data.timestamp).toLocaleString()}
								</p>
							)}
						</div>
					</div>
				</div>

				<div className="bg-white/80 dark:bg-zinc-800/80 p-5 rounded-lg">
					{renderResponse()}
				</div>

				<div className="flex justify-between mt-6">
					<button
						type="button"
						onClick={onReset}
						className={styles.secondaryButton}
					>
						Start Over
					</button>
				</div>
			</div>
		</div>
	);
};

export default ResponseRenderer;
