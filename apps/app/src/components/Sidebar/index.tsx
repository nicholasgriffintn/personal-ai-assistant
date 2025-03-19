import {
	Cloud,
	CloudOff,
	Edit,
	Loader2,
	MoreVertical,
	PanelLeftClose,
	PanelLeftOpen,
	SquarePen,
	Trash,
	Trash2,
} from "lucide-react";

import { Button, DropdownMenu, DropdownMenuItem } from "~/components/ui";
import {
	useChats,
	useDeleteAllChats,
	useDeleteChat,
	useUpdateChatTitle,
} from "~/hooks/useChat";
import { useChatStore } from "~/state/stores/chatStore";
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
		if (window.localStorage) {
			window.localStorage.setItem("localOnlyMode", String(newMode));
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
				className={`fixed md:relative
          z-30 md:z-auto
          h-full w-64
          bg-off-white dark:bg-zinc-900
          transition-transform duration-300 ease-in-out
          border-r border-zinc-200 dark:border-zinc-800
          ${sidebarVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-0"}
        `}
			>
				{sidebarVisible && (
					<div className="flex flex-col h-full w-64 overflow-hidden">
						<div className="sticky top-0 bg-off-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 md:border-r z-10 w-full h-[53px]">
							<div className="mx-2 my-2 flex items-center justify-between h-[37px]">
								<Button
									type="button"
									variant="icon"
									title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
									aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
									icon={
										sidebarVisible ? (
											<PanelLeftClose size={20} />
										) : (
											<PanelLeftOpen size={20} />
										)
									}
									onClick={() => setSidebarVisible(!sidebarVisible)}
								/>

								<div className="flex items-center gap-2">
									{isAuthenticated && (
										<Button
											type="button"
											variant={localOnlyMode ? "iconActive" : "icon"}
											title={
												localOnlyMode
													? "Switch to cloud mode"
													: "Switch to local-only mode"
											}
											aria-label={
												localOnlyMode
													? "Switch to cloud mode"
													: "Switch to local-only mode"
											}
											icon={
												localOnlyMode ? (
													<CloudOff size={20} />
												) : (
													<Cloud size={20} />
												)
											}
											onClick={toggleLocalOnlyMode}
										/>
									)}

									<Button
										type="button"
										variant="icon"
										onClick={clearCurrentConversation}
										title="New chat"
										aria-label="New chat"
										icon={<SquarePen size={20} />}
									/>
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
														data-conversation-id={conversation.id}
														key={conversation.id}
														className={`flex items-center justify-between p-2 rounded-lg cursor-pointer
															${
																currentConversationId === conversation.id
																	? "bg-off-white-highlight text-black dark:bg-[#2D2D2D] dark:text-white"
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
															{(conversation.isLocalOnly || localOnlyMode) && (
																<span className="mr-2 text-xs text-blue-500 dark:text-blue-400 inline-flex items-center">
																	<CloudOff size={14} className="mr-1" />
																	<span className="sr-only">Local only</span>
																</span>
															)}
															{conversation.title || "New conversation"}
														</div>
														{conversation.id && (
															<div className="flex items-center space-x-1">
																<Button
																	type="button"
																	variant="icon"
																	title="Edit conversation title"
																	aria-label="Edit conversation title"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleEditTitle(
																			conversation.id || "",
																			conversation.title || "",
																		);
																	}}
																	icon={<Edit size={14} />}
																	size="icon"
																/>
																<Button
																	type="button"
																	variant="icon"
																	onClick={(e) =>
																		handleDeleteChat(conversation.id || "", e)
																	}
																	icon={<Trash2 size={14} />}
																	size="icon"
																	title="Delete"
																	aria-label="Delete conversation"
																/>
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
										<div className="flex justify-between items-center">
											<div />
											<DropdownMenu
												position="top"
												trigger={<MoreVertical size={20} />}
												buttonProps={{
													variant: "icon",
													title: "Menu",
													"aria-label": "Open menu",
												}}
											>
												<DropdownMenuItem
													icon={<Trash size={16} />}
													onClick={handleDeleteAllChats}
												>
													Clear All Messages
												</DropdownMenuItem>
											</DropdownMenu>
										</div>
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
