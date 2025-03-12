import {
	Cloud,
	CloudOff,
	Edit,
	Loader2,
	PanelLeftClose,
	PanelLeftOpen,
	SquarePen,
	Trash,
	Trash2,
} from "lucide-react";

import {
	useChats,
	useDeleteAllChats,
	useDeleteChat,
	useUpdateChatTitle,
} from "../hooks/useChat";
import { useChatStore } from "../stores/chatStore";
import { ChatSidebarNotifications } from "./ChatSidebarNotifications";

export const ChatSidebar = () => {
	const {
		sidebarVisible,
		setSidebarVisible,
		currentConversationId,
		setCurrentConversationId,
		clearCurrentConversation,
		isAuthenticated,
		isAuthenticationLoading,
		isPro,
		localOnlyMode,
		setLocalOnlyMode,
	} = useChatStore();

	const { data: conversations = [], isLoading } = useChats();
	const deleteChat = useDeleteChat();
	const deleteAllChats = useDeleteAllChats();
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

	const handleDeleteAllChats = async () => {
		if (
			!window.confirm(
				"Are you sure you want to delete all conversations? This cannot be undone.",
			)
		) {
			return;
		}

		try {
			await deleteAllChats.mutateAsync();
		} catch (error) {
			console.error("Failed to delete all chats:", error);
			alert("Failed to delete all conversations. Please try again.");
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
				className={`fixed md:relative
          z-30 md:z-auto
          h-full w-64
          bg-white dark:bg-zinc-900
          transition-transform duration-300 ease-in-out
          border-r border-zinc-200 dark:border-zinc-800
          ${sidebarVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-0"}
        `}
			>
				{sidebarVisible && (
					<div className="flex flex-col h-full w-64 overflow-hidden">
						<div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 md:border-r z-10 w-full h-[53px]">
							<div className="mx-2 my-2 flex items-center justify-between h-[37px]">
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
											{localOnlyMode ? (
												<CloudOff size={20} />
											) : (
												<Cloud size={20} />
											)}
											<span className="sr-only">
												{localOnlyMode
													? "Switch to cloud mode"
													: "Switch to local-only mode"}
											</span>
										</button>
									)}

									<button
										type="button"
										onClick={clearCurrentConversation}
										className="rounded-lg p-[0.4em] hover:bg-zinc-100 cursor-pointer transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-500"
										title="New chat"
									>
										<SquarePen size={20} />
										<span className="sr-only">New chat</span>
									</button>
								</div>
							</div>
						</div>

						{isAuthenticationLoading ? (
							<div className="flex items-center gap-2 p-2">
								<Loader2
									size={20}
									className="animate-spin text-zinc-600 dark:text-zinc-400"
								/>
							</div>
						) : (
							<>
								{sidebarVisible && (
									<div>
										<ChatSidebarNotifications
											isAuthenticated={isAuthenticated}
											isPro={isPro}
											localOnlyMode={localOnlyMode}
										/>
									</div>
								)}

								<div
									className={`overflow-y-auto ${conversations.length > 0 ? "h-[calc(100vh-9rem)]" : "h-[calc(100vh-5rem)]"}`}
								>
									{isLoading ? (
										<div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
											Loading conversations...
										</div>
									) : conversations.length === 0 ? (
										<div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
											No conversations yet
										</div>
									) : (
										<>
											<ul className="space-y-1 p-2">
												{conversations.map((conversation) => (
													<li
														key={conversation.id}
														className={`flex items-center justify-between p-2 rounded-lg cursor-pointer
															${
																currentConversationId === conversation.id
																	? "bg-zinc-100 text-black dark:bg-[#2D2D2D] dark:text-white"
																	: "hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
															}
														`}
														onClick={() =>
															handleConversationClick(conversation.id)
														}
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
										</>
									)}
								</div>

								{conversations.length > 0 && (
									<div className="absolute bottom-0 left-0 right-0 p-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
										<button
											type="button"
											onClick={handleDeleteAllChats}
											className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
											title="Clear all conversations"
										>
											<Trash size={16} />
											<span>Clear All Messages</span>
										</button>
									</div>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</>
	);
};
