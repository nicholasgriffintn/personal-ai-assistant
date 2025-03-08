import {
	Edit,
	Trash2,
	PanelLeftClose,
	PanelLeftOpen,
	SquarePen,
} from "lucide-react";

import { useChatStore } from "../stores/chatStore";
import { useChats, useDeleteChat, useUpdateChatTitle } from "../hooks/useChat";

export const ChatSidebar = () => {
	const {
		sidebarVisible,
		setSidebarVisible,
		currentConversationId,
		setCurrentConversationId,
		startNewConversation,
	} = useChatStore();

	const { data: conversations = [], isLoading } = useChats();
	const deleteChat = useDeleteChat();
	const updateTitle = useUpdateChatTitle();

	const handleConversationClick = (id: string | undefined) => {
		setCurrentConversationId(id);

		if (window.matchMedia("(max-width: 768px)").matches) {
			setSidebarVisible(false);
		}
	};

	const handleEditTitle = async (chatId: string, currentTitle: string) => {
		const newTitle = prompt("Enter new title:", currentTitle);
		if (newTitle && newTitle !== currentTitle) {
			try {
				await updateTitle.mutateAsync({ chatId, title: newTitle });
			} catch (error) {
				console.error("Failed to update title:", error);
				alert("Failed to update title. Please try again.");
			}
		}
	};

	const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!window.confirm("Are you sure you want to delete this conversation?")) {
			return;
		}

		try {
			await deleteChat.mutateAsync(chatId);
			if (currentConversationId === chatId) {
				const firstConversation = conversations.find(c => c.id !== chatId);
				setCurrentConversationId(firstConversation?.id);
			}
		} catch (error) {
			console.error("Failed to delete chat:", error);
		}
	};

	return (
		<>
			{sidebarVisible && (
				<div
					className="md:hidden fixed inset-0 bg-black/30 z-20"
					onClick={() => setSidebarVisible(false)}
					onKeyDown={(e) => e.key === "Enter" && setSidebarVisible(false)}
				/>
			)}
			<div
				className={`
          fixed md:relative
          z-30 md:z-auto
          h-full
          bg-zinc-50 dark:bg-zinc-900
          transition-all duration-300
          border-r border-zinc-200 dark:border-zinc-800
          ${sidebarVisible ? "w-64 translate-x-0" : "w-0 -translate-x-full md:translate-x-0"}
        `}
			>
				<div
					className={`m-2 flex items-center justify-between 
          ${sidebarVisible ? "sticky" : "hidden"}
          `}
				>
					<button
						type="button"
						onClick={() => setSidebarVisible(!sidebarVisible)}
						className="
              rounded-lg p-[0.4em]
              hover:bg-zinc-100 hover:cursor-pointer
              transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-500"
					>
						{sidebarVisible ? (
							<PanelLeftClose size={20} />
						) : (
							<PanelLeftOpen size={20} />
						)}
						<span className="sr-only">
							{sidebarVisible ? "Hide sidebar" : "Show sidebar"}
						</span>
					</button>
					<button
						type="button"
						className="rounded-lg p-[0.4em] hover:bg-zinc-100 hover:cursor-pointer
              transition-colors text-zinc-600 dark:text-zinc-400 
              hover:text-zinc-800 dark:hover:text-zinc-500 dark:hover:bg-zinc-900"
						onClick={startNewConversation}
					>
						<SquarePen size={20} />
						<span className="sr-only">New conversation</span>
					</button>
				</div>
				{sidebarVisible ? (
					<div className="h-[calc(100%-3rem)] overflow-y-scroll scrollbar-thin dark:scrollbar-thumb-zinc-700 dark:scrollbar-track-zinc-900 flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-700 transition-all duration-300">
						<div className="flex flex-col">
							<ul className="p-2 space-y-1">
								{isLoading ? (
									<li className="text-zinc-600 dark:text-zinc-400">
										Loading conversations...
									</li>
								) : conversations.length === 0 ? (
									<li className="text-zinc-600 dark:text-zinc-400">
										No conversations yet
									</li>
								) : (
									conversations.map((conversation, index) => (
										<li
											key={`${conversation.id}-${index}`}
											data-id={conversation.id}
											className={`cursor-pointer p-2 transition-colors rounded-lg group ${conversation.id === currentConversationId ||
													(!currentConversationId && !conversation.id)
													? "bg-zinc-100 text-black dark:bg-[#2D2D2D] dark:text-white"
													: "hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
												}`}
											onClick={() => handleConversationClick(conversation.id)}
											onKeyDown={(e) =>
												e.key === "Enter" &&
												handleConversationClick(conversation.id)
											}
										>
											<div className="flex items-center justify-between">
												<span className="truncate flex-grow text-sm">
													{conversation.title || "New conversation"}
												</span>
												<div className="flex space-x-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
													<button
														type="button"
														className="hover:opacity-100 transition-opacity p-1.5 rounded-lg"
														onClick={(e) => {
															e.stopPropagation();
															handleEditTitle(conversation.id!, conversation.title);
														}}
													>
														<Edit size={16} />
														<span className="sr-only">Edit title</span>
													</button>
													<button
														type="button"
														className="hover:opacity-100 transition-opacity p-1.5 rounded-lg"
														onClick={(e) => handleDeleteChat(conversation.id!, e)}
													>
														<Trash2 size={16} />
														<span className="sr-only">Delete conversation</span>
													</button>
												</div>
											</div>
										</li>
									))
								)}
							</ul>
						</div>
					</div>
				) : null}
			</div>
		</>
	);
};
