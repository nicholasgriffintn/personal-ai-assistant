import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ChatApp } from "./routes/ChatApp";
import Terms from "./routes/Terms";
import Privacy from "./routes/Privacy";
import { ErrorProvider } from "./contexts/ErrorContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import ErrorToast from "./components/ErrorToast";

export function App() {
	return (
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
	);
}
