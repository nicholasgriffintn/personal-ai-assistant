import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";

interface DropdownMenuProps {
	trigger: ReactNode;
	children: ReactNode;
	position?: "top" | "bottom" | "left" | "right";
	buttonProps?: Omit<ButtonProps, "children">;
	className?: string;
	menuClassName?: string;
}

export const DropdownMenu = ({
	trigger,
	children,
	position = "bottom",
	buttonProps,
	className = "",
	menuClassName = "",
}: DropdownMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const positionClasses = {
		top: "bottom-full mb-2 left-0",
		bottom: "top-full mt-2 left-0",
		left: "right-full mr-2 top-0",
		right: "left-full ml-2 top-0",
	};

	return (
		<div className={`relative ${className}`} ref={menuRef}>
			{buttonProps ? (
				<Button {...buttonProps} onClick={() => setIsOpen(!isOpen)}>
					{trigger}
				</Button>
			) : (
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setIsOpen(!isOpen);
						}
					}}
				>
					{trigger}
				</button>
			)}

			{isOpen && (
				<div
					className={`absolute ${positionClasses[position]} w-48 rounded-md shadow-lg bg-off-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 z-20 ${menuClassName}`}
					role="menu"
					aria-orientation="vertical"
				>
					<div className="py-1">{children}</div>
				</div>
			)}
		</div>
	);
};

interface DropdownMenuItemProps {
	onClick?: () => void;
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
	disabled?: boolean;
}

export const DropdownMenuItem = ({
	onClick,
	icon,
	children,
	className = "",
	disabled = false,
}: DropdownMenuItemProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`cursor-pointer flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-off-white-highlight dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed z-10 ${className}`}
			disabled={disabled}
		>
			{icon}
			{children}
		</button>
	);
};
