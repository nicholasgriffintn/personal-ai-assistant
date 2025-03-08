import { useEffect } from 'react';

import { ChatNavbar } from './ChatNavbar';
import { ChatSidebar } from './ChatSidebar';
import { useChatStore } from '../stores/chatStore';
import { storeName } from '../constants';
import { useIndexedDB } from '../hooks/useIndexedDB';
import type { Conversation } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  hasApiKey?: boolean;
  onEnterApiKey?: () => void;
  isChat?: boolean;
}

export default function AppLayout({ 
  children, 
  hasApiKey = true, 
  onEnterApiKey = () => {}, 
  isChat = false 
}: AppLayoutProps) {
  const { 
    sidebarVisible, 
    setSidebarVisible,
    conversations,
    setConversations,
    currentConversationId,
    setCurrentConversationId
  } = useChatStore();
  
  const { db } = useIndexedDB();

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      setSidebarVisible(!isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setSidebarVisible]);

  const deleteConversation = async (id: number) => {
    try {
      if (!window.confirm('Are you sure you want to delete this conversation?')) {
        return;
      }

      await db?.delete(storeName, id);

      setConversations((prev) => {
        const filtered = prev.filter((conv) => conv.id !== id);
        return filtered;
      });
      
      if (currentConversationId === id) {
        const firstConversation = conversations.find(c => c.id !== id);
        setCurrentConversationId(firstConversation?.id);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const editConversationTitle = async (id: number, newTitle: string) => {
    try {
      const conversation = await db?.get(storeName, id) as Conversation;
      if (!conversation) return;
      
      conversation.title = newTitle;
      await db?.put(storeName, conversation);

      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.id === id) {
            return { ...conv, title: newTitle };
          }
          return conv;
        });
      });
    } catch (error) {
      console.error('Failed to edit conversation title:', error);
    }
  };

  const startNewConversation = async () => {
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    
    setCurrentConversationId(newId);
    
    if (window.matchMedia('(max-width: 768px)').matches) {
      setSidebarVisible(false);
    }
  };

  return (
    <div className="flex h-dvh w-screen overflow-clip bg-white dark:bg-zinc-900">
      <div className="flex flex-row flex-grow flex-1 overflow-hidden relative">
        {isChat && (
          <ChatSidebar
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            conversations={conversations}
            conversationId={currentConversationId}
            setConversationId={setCurrentConversationId}
            deleteConversation={deleteConversation}
            editConversationTitle={editConversationTitle}
            startNewConversation={startNewConversation}
          />
        )}
        <div className="flex flex-col flex-grow h-full w-full">
          <ChatNavbar 
            sidebarVisible={sidebarVisible} 
            setSidebarVisible={setSidebarVisible}
            hasApiKey={hasApiKey}
            onEnterApiKey={onEnterApiKey}
            showSidebarToggle={isChat && !sidebarVisible}
          />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 