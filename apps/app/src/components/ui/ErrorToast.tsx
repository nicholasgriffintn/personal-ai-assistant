import { AlertCircle, Info, XCircle } from "lucide-react";

import { Button } from "~/components/ui";
import { type ErrorMessage, useError } from "~/state/contexts/ErrorContext";

const ErrorToast = () => {
	const { errors, removeError } = useError();

	if (errors.length === 0) return null;

	const getIcon = (error: ErrorMessage) => {
		switch (error.severity) {
			case "error":
				return <XCircle className="h-5 w-5 text-red-500" />;
			case "warning":
				return <AlertCircle className="h-5 w-5 text-yellow-500" />;
			case "info":
				return <Info className="h-5 w-5 text-blue-500" />;
		}
	};

	const getBackgroundColor = (error: ErrorMessage) => {
		switch (error.severity) {
			case "error":
				return "bg-red-50 dark:bg-red-950";
			case "warning":
				return "bg-yellow-50 dark:bg-yellow-950";
			case "info":
				return "bg-blue-50 dark:bg-blue-950";
		}
	};

	const getTextColor = (error: ErrorMessage) => {
		switch (error.severity) {
			case "error":
				return "text-white dark:text-white";
			case "warning":
				return "text-white dark:text-white";
			case "info":
				return "text-white dark:text-white";
		}
	};

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
			{errors.map((error, index) => (
				<div
					key={`${error.id}-${index}`}
					className={`flex items-center gap-2 rounded-lg p-4 shadow-lg ${getBackgroundColor(error)} ${getTextColor(error)}`}
					role="alert"
				>
					{getIcon(error)}
					<span className="text-sm font-medium">{error.message}</span>
					<Button
						type="button"
						variant="ghost"
						onClick={() => removeError(error.id)}
						className="cursor-pointer ml-2 rounded-full p-1 hover:bg-black/5 dark:hover:bg-off-white/5"
						aria-label="Dismiss"
					>
						<XCircle className="h-4 w-4" />
					</Button>
				</div>
			))}
		</div>
	);
};

export default ErrorToast;
