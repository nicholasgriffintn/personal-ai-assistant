import { Terminal } from "lucide-react";
import type { FC } from "react";
import ResponseRenderer from "~/components/Apps/ResponseRenderer";
import type { Message } from "~/types";

interface ToolMessageProps {
	message: Message;
}

interface ToolMessageComponent extends FC<ToolMessageProps> {
	Icon: FC;
}

export const ToolMessage: FC<ToolMessageProps> = ({ message }) => {
	if (!message.data) return null;

	return (
		<div className="mb-2">
			<div className="text-xs font-medium text-blue-700 dark:text-blue-300 pt-1">
				{message.name} {message.status && `(${message.status})`}
			</div>
			<div className="mt-6 mb-6 bg-off-white/80 dark:bg-zinc-800/80 p-5 rounded-lg">
				<ResponseRenderer
					result={{
						status: message.status || "success",
						name: message.name || "Tool",
						content: message.content || "",
						data: message.data,
					}}
					responseType={
						typeof message.data === "object"
							? message.data.responseType
							: undefined
					}
					responseDisplay={
						typeof message.data === "object"
							? message.data.responseDisplay
							: undefined
					}
					className="mt-1"
				/>
			</div>
		</div>
	);
};

(ToolMessage as ToolMessageComponent).Icon = () => (
	<Terminal size={18} className="text-blue-600 dark:text-blue-400" />
);
