import { type FC, type FormEvent, useState } from "react";

import { apiKeyService } from "../lib/api-key";

interface WelcomeProps {
	onKeySubmit: () => void;
}

export const Welcome: FC<WelcomeProps> = ({ onKeySubmit }) => {
	const [apiKey, setApiKey] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!apiKey.trim()) {
			setError("API key is required");
			return;
		}

		if (!apiKeyService.validateApiKey(apiKey)) {
			setError("Invalid API key format");
			return;
		}

		try {
			await apiKeyService.setApiKey(apiKey);
			onKeySubmit();
		} catch (error) {
			setError("Failed to save API key securely");
		}
	};

	return (
		<div className="p-6">
			<div className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
						Enter your API key
					</h2>
					<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
						This is used to gain access to more features of the AI Assistant.
					</p>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div>
						<label
							htmlFor="apiKey"
							className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
						>
							API Key
						</label>
						<input
							id="apiKey"
							type="password"
							value={apiKey}
							onChange={(e) => {
								setApiKey(e.target.value);
								setError("");
							}}
							className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 
								bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white 
								placeholder-zinc-400 shadow-sm focus:border-blue-500 
								focus:outline-none focus:ring-1 focus:ring-blue-500"
							placeholder="Enter your API key"
						/>
						{error && (
							<p className="mt-2 text-sm text-red-600 dark:text-red-400">
								{error}
							</p>
						)}
					</div>
					<button
						type="submit"
						className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white 
							hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
							focus:ring-offset-2 disabled:opacity-50"
					>
						Submit
					</button>
				</form>
			</div>
		</div>
	);
};
