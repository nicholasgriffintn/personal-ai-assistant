interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-dvh w-screen overflow-clip bg-white dark:bg-zinc-900">
      <div className="flex flex-row flex-grow flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
} 