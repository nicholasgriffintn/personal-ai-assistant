import {
	Cloud,
	CloudOff,
	Edit,
	Loader2,
	PanelLeftClose,
	PanelLeftOpen,
	SquarePen,
	Trash2,
} from "lucide-react";

import { useChats, useDeleteChat, useUpdateChatTitle } from "../hooks/useChat";
import { useChatStore } from "../stores/chatStore";
import { ChatSidebarNotifications } from "./ChatSidebarNotifications";

export const ChatSidebar = () => {
	const {
		sidebarVisible,
		setSidebarVisible,
		currentConversationId,
		setCurrentConversationId,
		startNewConversation,
		isAuthenticated,
		isAuthenticationLoading,
		isPro,
		localOnlyMode,
		setLocalOnlyMode,
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

	const handleEditTitle = async (
		completion_id: string,
		currentTitle: string,
	) => {
		const newTitle = prompt("Enter new title:", currentTitle);
		if (newTitle && newTitle !== currentTitle) {
			try {
				await updateTitle.mutateAsync({ completion_id, title: newTitle });
			} catch (error) {
				console.error("Failed to update title:", error);
				alert("Failed to update title. Please try again.");
			}
		}
	};

	const handleDeleteChat = async (
		completion_id: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		if (!window.confirm("Are you sure you want to delete this conversation?")) {
			return;
		}

		try {
			await deleteChat.mutateAsync(completion_id);
			if (currentConversationId === completion_id) {
				const firstConversation = conversations.find(
					(c) => c.id !== completion_id,
				);
				setCurrentConversationId(firstConversation?.id);
			}
		} catch (error) {
			console.error("Failed to delete chat:", error);
		}
	};

	const toggleLocalOnlyMode = () => {
		const newMode = !localOnlyMode;
		setLocalOnlyMode(newMode);
		localStorage.setItem("localOnlyMode", String(newMode));
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
						className="rounded-lg p-[0.4em] hover:bg-zinc-100 cursor-pointer transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-500"
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

					<div className="flex items-center gap-2">
						{isAuthenticated && (
							<button
								type="button"
								onClick={toggleLocalOnlyMode}
								className={`rounded-lg p-[0.4em] hover:bg-zinc-100 cursor-pointer transition-colors ${
									localOnlyMode
										? "text-blue-600 dark:text-blue-400"
										: "text-zinc-600 dark:text-zinc-400"
								} hover:text-zinc-800 dark:hover:text-zinc-500`}
								title={
									localOnlyMode
										? "Local only mode (chats not stored on server)"
										: "Cloud mode (chats stored on server)"
								}
							>
								{localOnlyMode ? <CloudOff size={20} /> : <Cloud size={20} />}
								<span className="sr-only">
									{localOnlyMode
										? "Switch to cloud mode"
										: "Switch to local-only mode"}
								</span>
							</button>
						)}

						<button
							type="button"
							onClick={startNewConversation}
							className="rounded-lg p-[0.4em] hover:bg-zinc-100 cursor-pointer transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-500"
							title="New chat"
						>
							<SquarePen size={20} />
							<span className="sr-only">New chat</span>
						</button>
					</div>
				</div>

				{isAuthenticationLoading ? (
					<div className="flex items-center gap-2">
						<Loader2
							size={20}
							className="animate-spin text-zinc-600 dark:text-zinc-400"
						/>
					</div>
				) : (
					<>
						{sidebarVisible && (
							<ChatSidebarNotifications
								isAuthenticated={isAuthenticated}
								isPro={isPro}
								localOnlyMode={localOnlyMode}
							/>
						)}

						<div className="overflow-y-auto h-[calc(100vh-4rem)]">
							{isLoading ? (
								<div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
									Loading conversations...
								</div>
							) : conversations.length === 0 ? (
								<div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
									No conversations yet
								</div>
							) : (
								<ul className="space-y-1 p-2">
									{conversations.map((conversation) => (
										<li
											key={conversation.id}
											className={`
                    flex items-center justify-between
                    p-2 rounded-lg cursor-pointer
                    ${
											currentConversationId === conversation.id
												? "bg-zinc-100 text-black dark:bg-[#2D2D2D] dark:text-white"
												: "hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
										}
                  `}
											onClick={() => handleConversationClick(conversation.id)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													handleConversationClick(conversation.id);
												}
											}}
										>
											<div className="truncate flex-1">
												{conversation.title || "New conversation"}
												{(conversation.isLocalOnly || localOnlyMode) && (
													<span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
														(local)
													</span>
												)}
											</div>
											{conversation.id && (
												<div className="flex items-center space-x-1">
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleEditTitle(
																conversation.id || "",
																conversation.title || "",
															);
														}}
														className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
													>
														<Edit size={14} />
														<span className="sr-only">Edit</span>
													</button>
													<button
														type="button"
														onClick={(e) =>
															handleDeleteChat(conversation.id || "", e)
														}
														className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
													>
														<Trash2 size={14} />
														<span className="sr-only">Delete</span>
													</button>
												</div>
											)}
										</li>
									))}
								</ul>
							)}
						</div>
					</>
				)}
			</div>
		</>
	);
};
