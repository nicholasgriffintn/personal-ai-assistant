import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";

import { ConversationThread } from "~/components/ConversationThread";
import { SearchDialog } from "~/components/SearchDialog";
import { useAuthStatus } from "~/hooks/useAuth";
import { useKeyboardShortcuts } from "~/hooks/useKeyboardShortcuts";
import { AppLayout } from "~/layouts/AppLayout";
import { useChatStore } from "~/state/stores/chatStore";

export default function Home() {
	const {
		initializeStore,
		setSidebarVisible,
		isMobile,
		setIsMobile,
		currentConversationId,
	} = useChatStore();

	const { showSearch, setShowSearch } = useKeyboardShortcuts();

	const { isAuthenticated, isLoading: isAuthLoading } = useAuthStatus();

	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to initialize the store when the component mounts
	useEffect(() => {
		const init = async () => {
			const searchParams = new URLSearchParams(window.location.search);
			const completionId = searchParams.get("completion_id");
			await initializeStore(completionId || undefined);
		};

		init();
	}, []);

	useEffect(() => {
		const checkMobile = () => {
			const isMobile = window.matchMedia("(max-width: 768px)").matches;
			setIsMobile(isMobile);
			setSidebarVisible(!isMobile);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, [setSidebarVisible, setIsMobile]);

	return (
		<AppLayout isChat={true}>
			<div className="flex flex-row flex-grow flex-1 overflow-hidden relative h-full">
				<div className="flex flex-col flex-grow h-full w-[calc(100%-16rem)]">
					<div className="flex-1 overflow-hidden relative">
						<ConversationThread />
						<div className="absolute bottom-4 left-0 right-0 text-center text-sm text-zinc-600 dark:text-zinc-400">
							{isAuthLoading ? (
								<p className="mb-1 flex items-center justify-center gap-2">
									<Loader2 size={12} className="animate-spin" />
									<span>Loading...</span>
								</p>
							) : (
								<p className="mb-1">
									{isAuthenticated || currentConversationId ? (
										<>
											AI can make mistakes.
											{!isMobile &&
												" Check relevant sources before making important decisions."}
										</>
									) : (
										<>
											By using Polychat, you agree to our{" "}
											<Link
												to="/terms"
												className="hover:text-zinc-800 dark:hover:text-zinc-200 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
											>
												Terms
											</Link>{" "}
											&{" "}
											<Link
												to="/privacy"
												className="hover:text-zinc-800 dark:hover:text-zinc-200 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
											>
												Privacy
											</Link>
											.
										</>
									)}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			<SearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} />
		</AppLayout>
	);
}
