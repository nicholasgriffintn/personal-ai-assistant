import type { Dispatch, SetStateAction, FC } from 'react';
import { Edit, Trash2, PanelLeftClose, PanelLeftOpen, SquarePen } from 'lucide-react';

import type { Conversation } from '../types';

interface ChatSidebarProps {
	sidebarVisible: boolean;
	setSidebarVisible: Dispatch<SetStateAction<boolean>>;
	conversations: Conversation[];
	conversationId: number | undefined;
	setConversationId: Dispatch<SetStateAction<number | undefined>>;
	deleteConversation: (id: number) => void;
	editConversationTitle: (id: number, newTitle: string) => void;
	startNewConversation: () => void;
}

export const ChatSidebar: FC<ChatSidebarProps> = ({
	sidebarVisible,
	setSidebarVisible,
	conversations,
	conversationId,
	setConversationId,
	deleteConversation,
	editConversationTitle,
	startNewConversation,
}) => {
	const handleConversationClick = (id: number | undefined) => {
		setConversationId(id);
		if (window.matchMedia('(max-width: 768px)').matches) {
			setSidebarVisible(false);
		}
	};

	return (
		<>
			{sidebarVisible && (
				<div
					className="md:hidden fixed inset-0 bg-black/30 z-20"
					onClick={() => setSidebarVisible(false)}
					onKeyDown={(e) => e.key === 'Enter' && setSidebarVisible(false)}
				/>
			)}
			<div
				className={`
          fixed md:relative
          z-30 md:z-auto
          h-full
          bg-zinc-50 dark:bg-zinc-900
          transition-all duration-300
          
          ${sidebarVisible ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}
        `}
			>
				<div
					className={`m-2 flex items-center justify-between 
          ${sidebarVisible ? 'sticky' : 'hidden'}
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
						{sidebarVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
					</button>
					<button
						type="button"
						className="rounded-lg p-[0.4em]
              hover:bg-zinc-100 hover:cursor-pointer
              transition-colors text-zinc-600 dark:text-zinc-400 
              hover:text-zinc-800 dark:hover:text-zinc-500 dark:hover:bg-zinc-800"
						onClick={startNewConversation}
					>
						<SquarePen size={20} />
					</button>
				</div>
				<div
					className=" h-[calc(100%-3rem)]
        overflow-y-scroll scrollbar-thin 
          dark:scrollbar-thumb-zinc-700 dark:scrollbar-track-zinc-900
        flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-700 transition-all duration-300"
				>
					<div className="flex flex-col">
						<ul className="p-2 space-y-1">
							{conversations.map((conversation) => (
								<li
									key={conversation.id}
									className={`cursor-pointer p-2 transition-colors rounded-lg ${
										conversation.id === conversationId || (!conversationId && !conversation.id)
											? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
											: 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
									}`}
									onClick={() => handleConversationClick(conversation.id)}
									onKeyDown={(e) => e.key === 'Enter' && handleConversationClick(conversation.id)}
								>
									<div className="flex items-center justify-between">
										<span className="truncate flex-grow text-sm">{conversation.title}</span>
										<div className="flex space-x-2 ml-2">
											<button
												type="button"
												className="opacity-60 hover:opacity-100 transition-opacity"
												onClick={(e) => {
													e.stopPropagation();
													const newTitle = prompt('Enter new title:', conversation.title);
													if (newTitle) editConversationTitle(conversation.id!, newTitle);
												}}
											>
												<Edit size={14} />
											</button>
											<button
												type="button"
												className="opacity-60 hover:opacity-100 transition-opacity"
												onClick={(e) => {
													e.stopPropagation();
													deleteConversation(conversation.id!);
													setConversationId(undefined);
												}}
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</>
	);
};
