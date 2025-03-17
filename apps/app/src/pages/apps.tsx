import type { FC } from "react";

import DynamicApps from "~/components/Apps";
import AppLayout from "~/layouts/AppLayout";

const DynamicAppsRoute: FC = () => {
	return (
		<AppLayout>
			<div
				className="bg-off-white-highlight dark:bg-zinc-800 border-l-4 border-zinc-500 text-zinc-500 dark:text-zinc-400 p-4 mb-6"
				role="alert"
			>
				<p className="font-bold">Beta Feature</p>
				<p>
					Dynamic Apps is currently in beta. Some features may change, not work
					or be unavailable.
				</p>
			</div>
			<DynamicApps />
		</AppLayout>
	);
};

export default DynamicAppsRoute;
