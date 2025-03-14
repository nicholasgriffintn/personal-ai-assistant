import { useEffect } from "react";

import { authService } from "../lib/auth-service";
import { useChatStore } from "../stores/chatStore";

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
	const { setIsPro } = useChatStore();

	useEffect(() => {
		const user = authService.getUser();
		if (user) {
			setIsPro(user.plan === "pro");
		}
	}, [setIsPro]);

	return <>{children}</>;
};
