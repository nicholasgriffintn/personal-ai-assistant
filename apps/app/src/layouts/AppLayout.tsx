import { X } from "lucide-react";
import { useRef } from "react";

import { LoginModal } from "~/components/LoginModal";
import { ChatNavbar } from "~/components/Navbar";
import { ChatSidebar } from "~/components/Sidebar";
import { useKeyboardShortcuts } from "~/hooks/useKeyboardShortcuts";
import { useChatStore } from "~/state/stores/chatStore";

interface AppLayoutProps {
	children: React.ReactNode;
	isChat?: boolean;
}

export function AppLayout({ children, isChat = false }: AppLayoutProps) {
	const { sidebarVisible } = useChatStore();
	useKeyboardShortcuts();

	const dialogRef = useRef<HTMLDialogElement>(null);

	const showDialog = () => {
		dialogRef.current?.showModal();
	};

	const closeDialog = () => {
		dialogRef.current?.close();
	};

	return (
		<div className="flex h-dvh w-full max-w-full overflow-hidden bg-off-white dark:bg-zinc-900">
			<div className="flex flex-row w-full overflow-hidden relative">
				{isChat && <ChatSidebar />}
				<div className="flex flex-col min-w-0 flex-1 h-full">
					<ChatNavbar
						onEnterApiKey={showDialog}
						showSidebarToggle={isChat && !sidebarVisible}
					/>
					<div className="flex-1 overflow-auto w-full">
						{children}
						<dialog
							ref={dialogRef}
							className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4 p-0 bg-off-white dark:bg-zinc-900 rounded-lg shadow-xl backdrop:bg-black/50 max-h-[90vh] overflow-y-auto"
							onClick={(e) => {
								if (e.target === dialogRef.current) {
									closeDialog();
								}
							}}
							onKeyUp={(e) => {
								if (e.key === "Escape") {
									closeDialog();
								}
							}}
						>
							<div className="relative">
								<button
									type="button"
									onClick={closeDialog}
									className="cursor-pointer sticky top-4 right-4 float-right p-2 hover:bg-off-white-highlight dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400"
								>
									<X size={24} />
									<span className="sr-only">Close</span>
								</button>
								<LoginModal
									onKeySubmit={() => {
										closeDialog();
									}}
								/>
							</div>
						</dialog>
					</div>
				</div>
			</div>
		</div>
	);
}
