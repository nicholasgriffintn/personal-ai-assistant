import type { FC } from "react";

export const MessageSkeleton: FC = () => {
	return (
		<div className="animate-pulse">
			<div className="flex items-start space-x-4">
				<div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
				<div className="flex-1 space-y-3">
					<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
					<div className="space-y-2">
						<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
						<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
					</div>
				</div>
			</div>
		</div>
	);
};
