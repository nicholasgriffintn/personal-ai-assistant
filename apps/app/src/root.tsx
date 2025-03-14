import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { AppInitializer } from "./components/AppInitializer";
import ErrorToast from "./components/ErrorToast";
import { ErrorProvider } from "./contexts/ErrorContext";
import { LoadingProvider } from "./contexts/LoadingContext";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 2,
		},
	},
});

export function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark bg-white dark:bg-zinc-900">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Polychat - AI Assistant</title>
				<link
					rel="icon"
					type="image/png"
					href="/favicon-96x96.png"
					sizes="96x96"
				/>
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				<link rel="shortcut icon" href="/favicon.ico" />
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export function HydrateFallback() {
	return <div>Loading...</div>;
}

export default function Root() {
	return (
		<QueryClientProvider client={queryClient}>
			<ErrorProvider>
				<LoadingProvider>
					<AppInitializer>
						<Outlet />
						<ErrorToast />
					</AppInitializer>
				</LoadingProvider>
			</ErrorProvider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
