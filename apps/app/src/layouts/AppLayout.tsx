import { ChatNavbar } from "~/components/Navbar";
import { ChatSidebar } from "~/components/Sidebar";
import { useChatStore } from "~/state/stores/chatStore";

interface AppLayoutProps {
	children: React.ReactNode;
	onEnterApiKey?: () => void;
	isChat?: boolean;
}

export default function AppLayout({
	children,
	onEnterApiKey = () => {},
	isChat = false,
}: AppLayoutProps) {
	const { sidebarVisible } = useChatStore();

	return (
		<div className="flex h-dvh w-full max-w-full overflow-hidden bg-white dark:bg-zinc-900">
			<div className="flex flex-row w-full overflow-hidden relative">
				{isChat && <ChatSidebar />}
				<div className="flex flex-col min-w-0 flex-1 h-full">
					<ChatNavbar
						onEnterApiKey={onEnterApiKey}
						showSidebarToggle={isChat && !sidebarVisible}
					/>
					<div className="flex-1 overflow-auto w-full">{children}</div>
				</div>
			</div>
		</div>
	);
}
