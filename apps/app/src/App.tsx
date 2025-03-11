import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";

import ErrorToast from "./components/ErrorToast";
import { ErrorProvider } from "./contexts/ErrorContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { useAuthStatus } from "./hooks/useAuth";
import { authService } from "./lib/auth-service";
import { ChatApp } from "./routes/ChatApp";
import DynamicAppsRoute from "./routes/DynamicAppsRoute";
import Privacy from "./routes/Privacy";
import Terms from "./routes/Terms";
import { useChatStore } from "./stores/chatStore";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 2,
		},
	},
});

const AuthCallback = () => {
	const navigate = useNavigate();
	const { isLoading } = useAuthStatus();

	useEffect(() => {
		if (!isLoading) {
			navigate("/");
		}
	}, [isLoading, navigate]);

	return (
		<div className="flex flex-col items-center justify-center h-screen gap-4">
			<Loader2 size={32} className="animate-spin text-blue-600" />
			<p className="text-sm text-zinc-600 dark:text-zinc-400">
				Completing authentication...
			</p>
		</div>
	);
};

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
	const { setIsPro } = useChatStore();

	useEffect(() => {
		const user = authService.getUser();
		if (user) {
			setIsPro(user.plan === "pro");
		}
	}, [setIsPro]);

	return <>{children}</>;
};

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ErrorProvider>
				<LoadingProvider>
					<AppInitializer>
						<BrowserRouter>
							<Routes>
								<Route path="/" element={<ChatApp />} />
								<Route path="/apps" element={<DynamicAppsRoute />} />
								<Route path="/auth/callback" element={<AuthCallback />} />
								<Route path="/terms" element={<Terms />} />
								<Route path="/privacy" element={<Privacy />} />
							</Routes>
							<ErrorToast />
						</BrowserRouter>
					</AppInitializer>
				</LoadingProvider>
			</ErrorProvider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
