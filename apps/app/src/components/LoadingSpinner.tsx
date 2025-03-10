import { Loader2 } from "lucide-react";
import type { FC } from "react";

interface LoadingSpinnerProps {
	message?: string;
	progress?: number;
	className?: string;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({
	message,
	progress,
	className = "",
}) => {
	return (
		<div
			className={`flex flex-col items-center justify-center gap-2 ${className}`}
		>
			<div className="relative">
				<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
				{typeof progress === "number" && (
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
							{Math.round(progress)}%
						</span>
					</div>
				)}
			</div>
			{message && (
				<p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
			)}
		</div>
	);
};

export default LoadingSpinner;
