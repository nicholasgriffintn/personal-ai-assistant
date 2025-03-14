import {
	Cloud,
	FileText,
	Image,
	Mail,
	MessageSquare,
	Music,
	Search,
	Settings,
	Video,
} from "lucide-react";
import type { FC } from "react";

import type { AppListItem } from "~/lib/api/dynamic-apps";

interface AppCardProps {
	app: AppListItem;
	onSelect: () => void;
}

const AppCard: FC<AppCardProps> = ({ app, onSelect }) => {
	const getIcon = (iconName?: string) => {
		const iconProps = { className: "h-8 w-8", strokeWidth: 1.5 };

		switch (iconName) {
			case "chat-bubble":
				return (
					<MessageSquare
						{...iconProps}
						className="h-8 w-8 text-blue-500 dark:text-blue-400"
					/>
				);
			case "mail":
				return (
					<Mail
						{...iconProps}
						className="h-8 w-8 text-purple-500 dark:text-purple-400"
					/>
				);
			case "image":
				return (
					<Image
						{...iconProps}
						className="h-8 w-8 text-pink-500 dark:text-pink-400"
					/>
				);
			case "video":
				return (
					<Video
						{...iconProps}
						className="h-8 w-8 text-red-500 dark:text-red-400"
					/>
				);
			case "music":
				return (
					<Music
						{...iconProps}
						className="h-8 w-8 text-indigo-500 dark:text-indigo-400"
					/>
				);
			case "document":
				return (
					<FileText
						{...iconProps}
						className="h-8 w-8 text-amber-500 dark:text-amber-400"
					/>
				);
			case "search":
				return (
					<Search
						{...iconProps}
						className="h-8 w-8 text-cyan-500 dark:text-cyan-400"
					/>
				);
			case "cloud":
				return (
					<Cloud
						{...iconProps}
						className="h-8 w-8 text-sky-500 dark:text-sky-400"
					/>
				);
			default:
				return (
					<Settings
						{...iconProps}
						className="h-8 w-8 text-zinc-600 dark:text-zinc-300"
					/>
				);
		}
	};

	const getCategoryColor = (category?: string) => {
		switch (category) {
			case "functions":
				return "bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-300";
			default:
				return "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
		}
	};

	return (
		<button
			type="button"
			className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/70"
			onClick={onSelect}
			onKeyDown={(e) => e.key === "Enter" && onSelect()}
			tabIndex={0}
			aria-label={`Select ${app.name} app`}
		>
			<div className="flex items-start space-x-4">
				<div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-700">
					{getIcon(app.icon)}
				</div>
				<div className="flex-1">
					<h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
						{app.name}
					</h3>
					<p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">
						{app.description}
					</p>

					{app.category && (
						<span
							className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${getCategoryColor(app.category)}`}
						>
							{app.category}
						</span>
					)}
				</div>
			</div>
		</button>
	);
};

export default AppCard;
