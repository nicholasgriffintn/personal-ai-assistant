import { Link } from "react-router-dom";
import { PanelLeftOpen, KeyRound } from "lucide-react";

import { ChatThemeDropdown } from "./ChatThemeDropdown.tsx";
import { useChatStore } from "../stores/chatStore.ts";

interface ChatNavbarProps {
	sidebarVisible: boolean;
	setSidebarVisible: (visible: boolean) => void;
	onEnterApiKey: () => void;
	showSidebarToggle?: boolean;
}

export const ChatNavbar = ({
	sidebarVisible,
	setSidebarVisible,
	onEnterApiKey,
	showSidebarToggle = true,
}: ChatNavbarProps) => {
	const { hasApiKey } = useChatStore();

	return (
		<div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 z-10">
			<div className="m-2 flex items-center justify-between">
				<div className="flex items-center">
					{showSidebarToggle && (
						<div>
							<button
								type="button"
								onClick={() => setSidebarVisible(!sidebarVisible)}
								className="rounded-lg p-[0.4em] hover:bg-zinc-100 hover:cursor-pointer mr-2 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-500"
							>
								<PanelLeftOpen size={20} />
								<span className="sr-only">
									{sidebarVisible ? "Hide sidebar" : "Show sidebar"}
								</span>
							</button>
						</div>
					)}
					<h1 className="text-base font-semibold text-zinc-600 dark:text-zinc-200 ml-2">
						<Link
							to="/"
							className="hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline no-underline"
						>
							PolyChat - AI Assistant
						</Link>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					{!hasApiKey && (
						<button
							onClick={onEnterApiKey}
							className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
						>
							<KeyRound size={16} />
							<span>Enter API Key</span>
						</button>
					)}
					<ChatThemeDropdown />
				</div>
			</div>
		</div>
	);
};
