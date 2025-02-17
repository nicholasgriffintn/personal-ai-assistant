import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { ChatSidebar } from './ChatSidebar.tsx';
import { ChatNavbar } from './ChatNavbar.tsx';
import { ConversationThread } from './ConversationThread.tsx';
import { Welcome } from './Welcome.tsx';
import { storeName } from '../constants.ts';
import type { Conversation } from '../types';
import { useIndexedDB } from '../hooks/useIndexedDB';

interface ChatAppProps {
	hasApiKey: boolean;
	onKeySubmit: () => void;
}

export const ChatApp = ({ hasApiKey, onKeySubmit }: ChatAppProps) => {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [conversationId, setConversationId] = useState<number | undefined>(undefined);
	const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const { db } = useIndexedDB();

	useEffect(() => {
		getConversations();
		deleteUnusedConversations();
		startNewConversation();
	}, [db]);

	useEffect(() => {
		const isMobile = window.matchMedia('(max-width: 768px)').matches;
		setSidebarVisible(!isMobile);
	}, []);

	const getConversations = async () => {
		if (!db) return;

		const conversations = (await db.getAll(storeName)) as Conversation[];
		const inverseConversations = conversations.reverse();
		setConversations(inverseConversations);
	};

	const deleteConversation = async (id: number, showPromptToUser = true) => {
		try {
			if (showPromptToUser && !window.confirm('Are you sure you want to delete this conversation?')) {
				return;
			}

			await db?.delete(storeName, id);

			setConversations((prev) => prev.filter((conv) => conv.id !== id));
			setConversationId(conversations[0]?.id);
		} catch (error) {
			console.error('Failed to delete conversation:', error);
		}
	};

	const editConversationTitle = async (id: number, newTitle: string) => {
		const conversation = (await db!.get(storeName, id)) as Conversation;
		conversation.title = newTitle;

		await db!.put(storeName, conversation);

		setConversations((prev) => prev.map((conv) => (conv.id === id ? { ...conv, title: newTitle } : conv)));
	};

	const startNewConversation = async () => {
		setConversationId(Date.now() + Math.floor(Math.random() * 1000));

		if (window.matchMedia('(max-width: 768px)').matches) {
			setSidebarVisible(false);
		}
	};

	const deleteUnusedConversations = async () => {
		if (!db) {
			return;
		}

		const conversations = (await db.getAll(storeName)) as Conversation[];
		const unusedConversations = conversations.filter((conversation) => conversation.messages.length === 0);

		for (const conversation of unusedConversations) {
			deleteConversation(conversation.id as number, false);
		}
	};

	const showDialog = () => {
		dialogRef.current?.showModal();
	};

	const closeDialog = () => {
		dialogRef.current?.close();
	};

	return (
		<div className="flex h-dvh w-screen overflow-clip bg-white dark:bg-zinc-900">
			<div className="flex flex-row flex-grow flex-1 overflow-hidden relative">
				<ChatSidebar
					sidebarVisible={sidebarVisible}
					setSidebarVisible={setSidebarVisible}
					conversations={conversations}
					conversationId={conversationId}
					setConversationId={setConversationId}
					deleteConversation={deleteConversation}
					editConversationTitle={editConversationTitle}
					startNewConversation={startNewConversation}
				/>
				<div className="flex flex-col flex-grow h-full w-[calc(100%-16rem)]">
					<ChatNavbar 
						sidebarVisible={sidebarVisible} 
						setSidebarVisible={setSidebarVisible}
						hasApiKey={hasApiKey}
						onEnterApiKey={showDialog}
					/>
					<div className="flex-1 overflow-hidden relative">
						<ConversationThread
							conversations={conversations}
							conversationId={conversationId}
							setConversationId={setConversationId}
							setConversations={setConversations}
							db={db}
							hasApiKey={hasApiKey}
						/>
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
					<Welcome onKeySubmit={() => {
						onKeySubmit();
						closeDialog();
					}} />
				</div>
			</dialog>
		</div>
	);
};
