import { useState, useEffect, type FormEvent, type SetStateAction, type Dispatch, type FC, useRef } from 'react';

import '../styles/scrollbar.css';
import '../styles/github.css';
import '../styles/github-dark.css';
import { storeName, settingsStoreName } from '../constants';
import type { ChatMode, Conversation, Message, ChatSettings } from '../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAutoscroll } from '../hooks/useAutoscroll';
import { useStreamResponse } from '../hooks/useStreamResponse';
import { defaultModel } from '../lib/models';
import { useLoading } from '../contexts/LoadingContext';
import LoadingSpinner from './LoadingSpinner';
import { MessageSkeleton } from './MessageSkeleton';

interface ConversationThreadProps {
	conversations: Conversation[];
	conversationId?: number;
	setConversationId: (id: number) => void;
	setConversations: Dispatch<SetStateAction<Conversation[]>>;
	db: any;
	hasApiKey: boolean;
}

const defaultSettings: ChatSettings = {
	temperature: 1,
	top_p: 1,
	max_tokens: 2048,
	presence_penalty: 0,
	frequency_penalty: 0,
	useRAG: false,
	ragOptions: {
		topK: 3,
		scoreThreshold: 0.5,
		includeMetadata: false,
		namespace: '',
	},
};

export const ConversationThread: FC<ConversationThreadProps> = ({
	conversations,
	conversationId,
	setConversationId,
	setConversations,
	db,
	hasApiKey,
}) => {
	const [input, setInput] = useState<string>('');
	const [mode, setMode] = useState('remote' as ChatMode);
	const [model, setModel] = useState(defaultModel);
	const [chatSettings, setChatSettings] = useState<ChatSettings>(defaultSettings);
	const { isLoading, getMessage, getProgress } = useLoading();
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const abortControllerRef = useRef<AbortController | null>(null);
	const currentConversation = conversations.find((conv) => conv.id === conversationId) || { messages: [], title: '' };

	const { messagesEndRef, messagesContainerRef, scrollToBottom } = useAutoscroll();

	const {
		streamStarted,
		controller,
		streamResponse,
		aiResponseRef,
		aiReasoningRef,
	} = useStreamResponse({
		conversationId,
		setConversations,
		scrollToBottom,
		mode,
		model,
		chatSettings,
	});

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// Cmd/Ctrl + Enter to submit
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
				e.preventDefault();
				if (input.trim() && !isLoading('stream-response') && !isLoading('model-init')) {
					handleSubmit(e as unknown as FormEvent);
				}
			}

			// Esc to stop stream
			if (e.key === 'Escape' && controller) {
				controller.abort();
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [input, isLoading, controller]);

	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [aiReasoningRef.current, aiResponseRef.current, currentConversation.messages.length]);

	useEffect(() => {
		let isMounted = true;

		if (db) {
			const loadSettings = async () => {
				try {
					const store = db.transaction(settingsStoreName, 'readonly').objectStore(settingsStoreName);
					const savedSettings = await store.get('userSettings');
					if (isMounted && savedSettings) {
						setMode(savedSettings.mode || 'remote');
						setModel(savedSettings.model || defaultModel);
						setChatSettings(savedSettings.chatSettings || defaultSettings);
					}
				} catch (error) {
					console.error('Failed to load settings:', error);
					if (isMounted) {
						alert('Failed to load settings. Please try again.');
					}
				} finally {
					if (isMounted) {
						setIsInitialLoad(false);
					}
				}
			};
			loadSettings();
		}

		return () => {
			isMounted = false;
		};
	}, [db]);

	const setShowMessageReasoning = (index: number, showReasoning: boolean) => {
		setConversations((prev) => {
			const updated = [...prev];
			const conv = updated.find((c) => c.id === conversationId);
			if (conv && conv.messages[index].reasoning) {
				conv.messages[index].reasoning!.collapsed = showReasoning;
			}
			return updated;
		});
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		if (db) {
			try {
				const store = db.transaction(settingsStoreName, 'readwrite').objectStore(settingsStoreName);
				await store.put({
					id: 'userSettings',
					model,
					mode,
					chatSettings,
				});
			} catch (error) {
				console.error('Failed to save settings:', error);
				alert('Failed to save settings. Please try again.');
			}
		}

		const userMessage: Message = { role: 'user', content: input, id: 'user', created: Date.now(), model };
		let updatedMessages: Message[] = [];

		if (currentConversation.messages.length === 0) {
			setConversations((prev) => {
				const updated = [...prev];
				updated.unshift({
					id: conversationId,
					title: 'New conversation',
					messages: [userMessage],
				});
				updatedMessages = [userMessage];
				return updated;
			});
		} else {
			setConversations((prev) => {
				const updated = [...prev];
				const conv = updated.find((c) => c.id === conversationId);
				if (conv) {
					conv.messages.push(userMessage);
					updatedMessages = [...conv.messages];
				}
				return updated;
			});
		}

		setInput('');

		try {
			await streamResponse(updatedMessages);
		} catch (error) {
			console.error('Failed to send message:', error);
			alert('Failed to send message. Please try again.');
		}
	};

	const handleTranscribe = async (data: {
		response: {
			content: string;
		};
	}) => {
		setInput(data.response.content);
	};

	const storeMessages = async () => {
		if (!currentConversation.messages || currentConversation.messages.length === 0) {
			return;
		}

		const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
		const objectData = {
			id: conversationId,
			title: currentConversation.title,
			messages: currentConversation.messages,
		};
		const value = await store.put(objectData);
		setConversationId(value);
	};

	useEffect(() => {
		if (db && conversationId) {
			storeMessages();
		}
	}, [conversations]);

	return (
		<div className={`flex flex-col h-[calc(100%-3rem)] w-full ${currentConversation.messages.length === 0 ? 'justify-center' : ''}`}>
			<div
				ref={messagesContainerRef}
				className={`overflow-x-hidden ${currentConversation.messages.length === 0 ? 'flex items-center justify-center pb-6' : 'flex-1 overflow-y-scroll'}`}
			>
				<div className="max-w-2xl mx-auto w-full px-4">
					{currentConversation.messages.length === 0 ? (
						<div className="text-center">
							<h1 className="text-4xl font-semibold text-zinc-800 dark:text-zinc-200">What do you want to know?</h1>
						</div>
					) : isInitialLoad ? (
						<div className="py-4 space-y-4">
							{[...Array(3)].map((_, i) => (
								<MessageSkeleton key={i} />
							))}
						</div>
					) : (
						<div className="py-4 space-y-4">
							{currentConversation.messages.map((message, index) => (
								<ChatMessage
									key={message.id || index}
									message={message}
									index={index}
									setShowMessageReasoning={setShowMessageReasoning}
								/>
							))}
							{isLoading('stream-response') && (
								<div className="flex justify-center py-4">
									<LoadingSpinner
										message={getMessage('stream-response')}
									/>
								</div>
							)}
							{isLoading('model-init') && (
								<div className="flex justify-center py-4">
									<LoadingSpinner
										message={getMessage('model-init')}
										progress={getProgress('model-init')}
									/>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>
			</div>

			<div className={`p-4 ${currentConversation.messages.length === 0 ? 'pb-35' : ''}`}>
				<div className="max-w-2xl mx-auto">
					<ChatInput
						input={input}
						setInput={setInput}
						handleSubmit={handleSubmit}
						isLoading={isLoading('stream-response') || isLoading('model-init')}
						streamStarted={streamStarted}
						controller={controller}
						mode={mode}
						onModeChange={(mode) => setMode(mode)}
						model={model}
						onModelChange={(model) => setModel(model)}
						chatSettings={chatSettings}
						onChatSettingsChange={setChatSettings}
						onTranscribe={handleTranscribe}
						hasApiKey={hasApiKey}
					/>
				</div>
			</div>
		</div>
	);
};
