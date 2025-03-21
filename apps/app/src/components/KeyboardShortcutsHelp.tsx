import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui";

interface KeyboardShortcutsHelpProps {
	isOpen: boolean;
	onClose: () => void;
}

interface Shortcut {
	id: string;
	description: string;
	keys: string[];
}

export const KeyboardShortcutsHelp = ({
	isOpen,
	onClose,
}: KeyboardShortcutsHelpProps) => {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const previousActiveElement = useRef<Element | null>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (isOpen) {
			previousActiveElement.current = document.activeElement;
			dialogRef.current?.showModal();
			setTimeout(() => {
				closeButtonRef.current?.focus();
			}, 50);
		} else {
			dialogRef.current?.close();
			if (
				previousActiveElement.current &&
				"focus" in previousActiveElement.current
			) {
				(previousActiveElement.current as HTMLElement).focus();
			}
		}
	}, [isOpen]);

	useEffect(() => {
		return () => {
			if (dialogRef.current?.open) {
				dialogRef.current.close();
			}
		};
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const handleTabKey = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			const dialog = dialogRef.current;
			if (!dialog) return;

			const focusableElements = dialog.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			) as NodeListOf<HTMLElement>;

			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault();
				lastElement.focus();
			} else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault();
				firstElement.focus();
			}
		};

		document.addEventListener("keydown", handleTabKey);
		return () => document.removeEventListener("keydown", handleTabKey);
	}, [isOpen]);

	if (!isOpen) return null;

	const shortcuts: Shortcut[] = [
		{
			id: "search",
			description: "Search",
			keys: ["⌘", "K"],
		},
		{
			id: "new-chat",
			description: "New Chat",
			keys: ["⌘", "⇧", "O"],
		},
		{
			id: "toggle-sidebar",
			description: "Toggle Sidebar",
			keys: ["⌘", "B"],
		},
		{
			id: "toggle-keyboard-shortcuts",
			description: "Toggle Keyboard Shortcuts",
			keys: ["⌘", "/"],
		},
		{
			id: "toggle-local-only-mode",
			description: "Toggle Local Only Mode",
			keys: ["⌘", "⇧", "L"],
		},
	];

	const KeyComponent = ({ keyValue }: { keyValue: string }) => (
		<div className="flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded w-9 h-9">
			<span className="text-zinc-200">{keyValue}</span>
		</div>
	);

	return (
		<dialog
			ref={dialogRef}
			className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full mx-4 p-0 bg-off-white dark:bg-zinc-900 rounded-lg shadow-xl backdrop:bg-black/50 max-h-[90vh] overflow-y-auto"
			onClick={(e) => {
				if (e.target === dialogRef.current) {
					onClose();
				}
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					e.preventDefault();
					onClose();
				}
			}}
			aria-labelledby="keyboard-shortcuts-title"
			aria-describedby="keyboard-shortcuts-description"
		>
			<div className="p-6">
				<div className="flex items-center justify-between mb-4">
					<h2
						id="keyboard-shortcuts-title"
						className="text-xl font-semibold text-zinc-800 dark:text-zinc-100"
					>
						Keyboard Shortcuts
					</h2>
					<Button
						ref={closeButtonRef}
						type="button"
						variant="icon"
						onClick={onClose}
						title="Close keyboard shortcuts dialog"
						aria-label="Close keyboard shortcuts dialog"
						icon={<X size={20} />}
					/>
				</div>

				<div
					id="keyboard-shortcuts-description"
					className="grid grid-cols-2 gap-x-6"
				>
					<div className="space-y-6">
						{shortcuts.slice(0, 4).map((shortcut) => (
							<div
								key={shortcut.description}
								className="flex items-center justify-between py-2"
							>
								<span className="text-zinc-700 dark:text-zinc-300">
									{shortcut.description}
								</span>
								<div className="flex gap-1">
									{shortcut.keys.map((keyValue) => (
										<KeyComponent key={shortcut.id} keyValue={keyValue} />
									))}
								</div>
							</div>
						))}
					</div>
					<div className="space-y-6">
						{shortcuts.slice(4).map((shortcut) => (
							<div
								key={shortcut.description}
								className="flex items-center justify-between py-2"
							>
								<span className="text-zinc-700 dark:text-zinc-300">
									{shortcut.description}
								</span>
								<div className="flex gap-1">
									{shortcut.keys.map((keyValue) => (
										<KeyComponent key={shortcut.id} keyValue={keyValue} />
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</dialog>
	);
};
