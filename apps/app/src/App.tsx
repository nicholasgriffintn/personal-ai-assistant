import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { ChatApp } from "./routes/ChatApp";
import Terms from "./routes/Terms";
import Privacy from "./routes/Privacy";
import { ErrorProvider } from "./contexts/ErrorContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import ErrorToast from "./components/ErrorToast";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 2,
		},
	},
});

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ErrorProvider>
				<LoadingProvider>
					<BrowserRouter>
						<Routes>
							<Route
								path="/"
								element={
									<ChatApp />
								}
							/>
							<Route path="/terms" element={<Terms />} />
							<Route path="/privacy" element={<Privacy />} />
						</Routes>
						<ErrorToast />
					</BrowserRouter>
				</LoadingProvider>
			</ErrorProvider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
