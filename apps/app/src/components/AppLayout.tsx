import { useChatStore } from "../stores/chatStore";
import { ChatNavbar } from "./ChatNavbar";
import { ChatSidebar } from "./ChatSidebar";

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
		<div className="flex h-dvh w-screen overflow-clip bg-white dark:bg-zinc-900">
			<div className="flex flex-row flex-grow flex-1 overflow-hidden relative">
				{isChat && <ChatSidebar />}
				<div className="flex flex-col flex-grow h-full w-full">
					<ChatNavbar
						onEnterApiKey={onEnterApiKey}
						showSidebarToggle={isChat && !sidebarVisible}
					/>
					<div className="flex-1 overflow-auto">{children}</div>
				</div>
			</div>
		</div>
	);
}
