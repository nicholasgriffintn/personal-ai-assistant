import { useState, useEffect } from "react";

import { apiKeyService } from "./lib/api-key";
import { ChatApp } from "./components/ChatApp";
import { ErrorProvider } from "./contexts/ErrorContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import ErrorToast from "./components/ErrorToast";

export function App() {
	const [hasApiKey, setHasApiKey] = useState(false);

	useEffect(() => {
		const apiKey = apiKeyService.getApiKey();
		setHasApiKey(!!apiKey);
	}, []);

	const handleKeySubmit = () => {
		setHasApiKey(true);
	};

	return (
		<ErrorProvider>
			<LoadingProvider>
				<>
					<ChatApp hasApiKey={hasApiKey} onKeySubmit={handleKeySubmit} />
					<ErrorToast />
				</>
			</LoadingProvider>
		</ErrorProvider>
	);
}
