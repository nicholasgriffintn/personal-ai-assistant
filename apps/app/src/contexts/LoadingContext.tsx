import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface LoadingState {
	id: string;
	message?: string;
	progress?: number;
}

interface LoadingContextType {
	loadingStates: LoadingState[];
	startLoading: (id: string, message?: string) => void;
	updateLoading: (id: string, progress: number, message?: string) => void;
	stopLoading: (id: string) => void;
	isLoading: (id: string) => boolean;
	getProgress: (id: string) => number | undefined;
	getMessage: (id: string) => string | undefined;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
	const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);

	const startLoading = useCallback((id: string, message?: string) => {
		setLoadingStates((prev) => [
			...prev.filter((state) => state.id !== id),
			{ id, message },
		]);
	}, []);

	const updateLoading = useCallback((id: string, progress: number, message?: string) => {
		setLoadingStates((prev) =>
			prev.map((state) =>
				state.id === id
					? { ...state, progress, message: message ?? state.message }
					: state,
			),
		);
	}, []);

	const stopLoading = useCallback((id: string) => {
		setLoadingStates((prev) => prev.filter((state) => state.id !== id));
	}, []);

	const isLoading = useCallback((id: string) =>
		loadingStates.some((state) => state.id === id),
	[loadingStates]);

	const getProgress = useCallback((id: string) =>
		loadingStates.find((state) => state.id === id)?.progress,
	[loadingStates]);

	const getMessage = useCallback((id: string) =>
		loadingStates.find((state) => state.id === id)?.message,
	[loadingStates]);

	return (
		<LoadingContext.Provider
			value={{
				loadingStates,
				startLoading,
				updateLoading,
				stopLoading,
				isLoading,
				getProgress,
				getMessage,
			}}
		>
			{children}
		</LoadingContext.Provider>
	);
}

export function useLoading() {
	const context = useContext(LoadingContext);
	if (context === undefined) {
		throw new Error("useLoading must be used within a LoadingProvider");
	}
	return context;
}
