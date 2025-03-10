import {
	KeyRound,
	Loader2,
	LogOut,
	Menu,
	PanelLeftOpen,
	User,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { APP_NAME, APP_TAGLINE } from "../constants";
import { useAuthStatus } from "../hooks/useAuth.ts";
import { useChatStore } from "../stores/chatStore.ts";
import { ChatThemeDropdown } from "./ChatThemeDropdown.tsx";

interface ChatNavbarProps {
	onEnterApiKey: () => void;
	showSidebarToggle?: boolean;
}

export const ChatNavbar = ({
	onEnterApiKey,
	showSidebarToggle = true,
}: ChatNavbarProps) => {
	const { hasApiKey, isMobile, sidebarVisible, setSidebarVisible } =
		useChatStore();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const { user, logout, isLoggingOut, isLoading } = useAuthStatus();

	const handleLogout = () => {
		logout();
		setIsUserMenuOpen(false);
		onEnterApiKey();
	};

	return (
		<div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 z-10">
			<div className="m-2 flex items-center justify-between">
				<div className="flex items-center">
					{showSidebarToggle && (
						<div>
							<button
								type="button"
								onClick={() => setSidebarVisible(!sidebarVisible)}
								className="rounded-lg p-[0.4em] hover:bg-zinc-100 cursor-pointer mr-2 transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-500"
							>
								{isMobile ? <Menu size={20} /> : <PanelLeftOpen size={20} />}
								<span className="sr-only">
									{sidebarVisible ? "Hide sidebar" : "Show sidebar"}
								</span>
							</button>
						</div>
					)}
					<h1 className="text-base font-semibold text-zinc-600 dark:text-zinc-200 ml-2 truncate">
						<Link
							to="/"
							className="hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline no-underline"
						>
							{isMobile ? APP_NAME : `${APP_NAME} - ${APP_TAGLINE}`}
						</Link>
					</h1>
				</div>
				<div className="flex items-center gap-2 sm:gap-4">
					{isLoading ? (
						<div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
							<Loader2 size={16} className="animate-spin" />
							{!isMobile && <span>Loading...</span>}
						</div>
					) : !hasApiKey ? (
						<button
							onClick={onEnterApiKey}
							className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
						>
							<KeyRound size={16} />
							{!isMobile && <span>Sign In</span>}
						</button>
					) : user ? (
						<div className="relative">
							<button
								onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
								className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
								disabled={isLoggingOut}
							>
								<User size={16} />
								{!isMobile && <span>{user.github_username}</span>}
							</button>
							{isUserMenuOpen && (
								<div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5">
									<div className="py-1">
										{isMobile && (
											<div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
												{user.github_username}
											</div>
										)}
										<button
											onClick={handleLogout}
											className="cursor-pointer flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
											disabled={isLoggingOut}
										>
											<LogOut size={16} />
											<span>Sign out</span>
										</button>
									</div>
								</div>
							)}
						</div>
					) : null}
					<ChatThemeDropdown />
				</div>
			</div>
		</div>
	);
};
