import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui";

type KeyboardShortcutsHelpProps = {
	isOpen: boolean;
	onClose: () => void;
};

export const KeyboardShortcutsHelp = ({
	isOpen,
	onClose,
}: KeyboardShortcutsHelpProps) => {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (isOpen) {
			dialogRef.current?.showModal();
		} else {
			dialogRef.current?.close();
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const shortcuts = [
		{ key: "⌘K", description: "Search" },
		{ key: "⌘⇧O", description: "New Chat" },
		{ key: "⌘B", description: "Toggle Sidebar" },
	];

	return (
		<dialog
			ref={dialogRef}
			className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4 p-0 bg-off-white dark:bg-zinc-900 rounded-lg shadow-xl backdrop:bg-black/50 max-h-[90vh] overflow-y-auto"
			onClick={(e) => {
				if (e.target === dialogRef.current) {
					onClose();
				}
			}}
			onKeyUp={(e) => {
				if (e.key === "Escape") {
					onClose();
				}
			}}
		>
			<div className="p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
						Keyboard Shortcuts
					</h2>
					<Button
						type="button"
						variant="icon"
						onClick={onClose}
						title="Close"
						aria-label="Close"
						icon={<X size={20} />}
					/>
				</div>

				<div className="space-y-4">
					{shortcuts.map((shortcut) => (
						<div
							key={shortcut.key}
							className="flex items-center justify-between py-2"
						>
							<span className="text-sm text-zinc-700 dark:text-zinc-300">
								{shortcut.description}
							</span>
							<kbd className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-sm text-zinc-800 dark:text-zinc-200 font-mono">
								{shortcut.key}
							</kbd>
						</div>
					))}
				</div>
			</div>
		</dialog>
	);
};
