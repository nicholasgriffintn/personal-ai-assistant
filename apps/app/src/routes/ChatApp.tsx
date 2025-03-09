import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { ConversationThread } from "../components/ConversationThread.tsx";
import { Welcome } from "../components/Welcome.tsx";
import AppLayout from "../components/AppLayout.tsx";
import { useChatStore } from "../stores/chatStore.ts";

export const ChatApp = () => {
	const { initializeStore, setSidebarVisible, isMobile, setIsMobile } = useChatStore();

	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const init = async () => {
			await initializeStore();
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

	const showDialog = () => {
		dialogRef.current?.showModal();
	};

	const closeDialog = () => {
		dialogRef.current?.close();
	};

	return (
		<AppLayout onEnterApiKey={showDialog} isChat={true}>
			<div className="flex flex-row flex-grow flex-1 overflow-hidden relative h-full">
				<div className="flex flex-col flex-grow h-full w-[calc(100%-16rem)]">
					<div className="flex-1 overflow-hidden relative">
						<ConversationThread />
						<div className="absolute bottom-4 left-0 right-0 text-center text-sm text-zinc-500">
							<p className="mb-1">
								AI can make mistakes.{!isMobile && " Check relevant sources before making important decisions."}
							</p>
							<div className="flex gap-4 justify-center">
								<Link
									to="/terms"
									className="hover:text-zinc-700 dark:hover:text-zinc-300 underline"
								>
									Terms of Service
								</Link>
								<Link
									to="/privacy"
									className="hover:text-zinc-700 dark:hover:text-zinc-300 underline"
								>
									Privacy Policy
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			<dialog
				ref={dialogRef}
				className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4 p-0 bg-white dark:bg-zinc-900 rounded-lg shadow-xl backdrop:bg-black/50 max-h-[90vh] overflow-y-auto"
				onClick={(e) => {
					if (e.target === dialogRef.current) {
						closeDialog();
					}
				}}
			>
				<div className="relative">
					<button
						onClick={closeDialog}
						className="sticky top-4 right-4 float-right p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-600 dark:text-zinc-400"
					>
						<X size={24} />
						<span className="sr-only">Close</span>
					</button>
					<Welcome
						onKeySubmit={() => {
							closeDialog();
						}}
					/>
				</div>
			</dialog>
		</AppLayout>
	);
};
