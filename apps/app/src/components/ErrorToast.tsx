import { type FC } from "react";
import { AlertCircle, Info, XCircle } from "lucide-react";
import { useError, type ErrorMessage } from "../contexts/ErrorContext";

const ErrorToast: FC = () => {
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

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
			{errors.map((error, index) => (
				<div
					key={`${error.id}-${index}`}
					className={`flex items-center gap-2 rounded-lg p-4 shadow-lg ${getBackgroundColor(error)}`}
					role="alert"
				>
					{getIcon(error)}
					<span className="text-sm font-medium">{error.message}</span>
					<button
						onClick={() => removeError(error.id)}
						className="ml-2 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
						aria-label="Dismiss"
					>
						<XCircle className="h-4 w-4" />
					</button>
				</div>
			))}
		</div>
	);
};

export default ErrorToast;
