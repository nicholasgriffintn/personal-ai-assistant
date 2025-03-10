import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authService } from "../lib/auth-service";
import { useChatStore } from "../stores/chatStore";

export const AUTH_QUERY_KEYS = {
	authStatus: ["auth", "status"],
	user: ["auth", "user"],
};

export function useAuthStatus() {
	const { setHasApiKey, setIsAuthenticated, setIsPro } = useChatStore();
	const queryClient = useQueryClient();

	const { data: isAuthenticated, isLoading } = useQuery({
		queryKey: AUTH_QUERY_KEYS.authStatus,
		queryFn: async () => {
			const isAuth = await authService.checkAuthStatus();
			setIsAuthenticated(isAuth);

			if (isAuth) {
				const token = await authService.getToken();
				setHasApiKey(!!token);

				const user = authService.getUser();
				setIsPro(user?.plan === "pro");
			} else {
				setIsPro(false);
			}

			return isAuth;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const { data: user } = useQuery({
		queryKey: AUTH_QUERY_KEYS.user,
		queryFn: () => authService.getUser(),
		enabled: !!isAuthenticated,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const loginWithGithub = () => {
		authService.initiateGithubLogin();
	};

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const success = await authService.logout();
			if (success) {
				setIsAuthenticated(false);
				setHasApiKey(false);
				return true;
			}
			return false;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.authStatus });
			queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
		},
	});

	return {
		isAuthenticated: !!isAuthenticated,
		isLoading,
		user,
		loginWithGithub,
		logout: logoutMutation.mutate,
		isLoggingOut: logoutMutation.isPending,
	};
}
