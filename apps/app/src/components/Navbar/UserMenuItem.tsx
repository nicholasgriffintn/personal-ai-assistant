import { KeyRound, Loader2, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuthStatus } from "~/hooks/useAuth";
import { useChatStore } from "~/state/stores/chatStore";

type UserMenuItemProps = {
	onEnterApiKey: () => void;
};

export function UserMenuItem({ onEnterApiKey }: UserMenuItemProps) {
	const { isAuthenticated, isMobile } = useChatStore();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const { user, logout, isLoggingOut, isLoading } = useAuthStatus();
	const userMenuRef = useRef<HTMLDivElement>(null);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const handleLogout = () => {
		logout();
		setIsUserMenuOpen(false);
		onEnterApiKey();
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				userMenuRef.current &&
				!userMenuRef.current.contains(event.target as Node)
			) {
				setIsUserMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	if (!isMounted) {
		return (
			<div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
				<User size={16} />
				<span className={isMobile ? "sr-only" : ""}>Login</span>
			</div>
		);
	}

	return (
		<>
			{isLoading ? (
				<div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
					<Loader2 size={16} className="animate-spin" />
					<span className="sr-only">Loading...</span>
				</div>
			) : !isAuthenticated ? (
				<button
					type="button"
					onClick={onEnterApiKey}
					className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
				>
					<KeyRound size={16} />
					<span className={isMobile ? "sr-only" : ""}>Login</span>
				</button>
			) : user ? (
				<div className="relative" ref={userMenuRef}>
					<button
						type="button"
						onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
						className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-off-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"
						disabled={isLoggingOut}
					>
						<User size={16} />
						<span className="sr-only">User menu</span>
					</button>
					{isUserMenuOpen && (
						<div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-off-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 z-20">
							<div className="py-1">
								<div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 truncate">
									{user.github_username}
								</div>
								<button
									type="button"
									onClick={handleLogout}
									className="cursor-pointer flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-off-white-highlight dark:hover:bg-zinc-700"
									disabled={isLoggingOut}
								>
									<LogOut size={16} />
									<span>Logout</span>
								</button>
							</div>
						</div>
					)}
				</div>
			) : null}
		</>
	);
}
