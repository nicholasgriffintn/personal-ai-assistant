import { type JSX, useEffect, useRef, useState, type FC } from 'react';
import { Moon, Sun, Monitor, ChevronDown } from 'lucide-react';

import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../types';

interface ThemeOption {
	value: Theme;
	icon: ({ className }: { className: string }) => JSX.Element;
	text: string;
}

export const ChatThemeDropdown: FC = () => {
	const [theme, setTheme] = useTheme();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const themeOptions: ThemeOption[] = [
		{
			value: 'system',
			icon: ({ className }: { className: string }) => <Monitor className={className} />,
			text: 'System',
		},
		{
			value: 'light',
			icon: ({ className }: { className: string }) => <Sun className={className} />,
			text: 'Light',
		},
		{
			value: 'dark',
			icon: ({ className }: { className: string }) => <Moon className={className} />,
			text: 'Dark',
		},
	];

	const handleThemeChange = (newTheme: Theme) => {
		setTheme(newTheme);
		setIsOpen(false);
	};

	const currentTheme = themeOptions.find((option) => option.value === theme) || themeOptions[0];

	return (
		<div ref={dropdownRef} className="relative inline-block text-left border-zinc-300 dark:border-zinc-600 text-xs">
			<div>
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className={`
						inline-flex text-xs w-14 p-2
						justify-between items-center
						rounded-lg
						dark:bg-zinc-900 text-sm font-normal text-zinc-700 
						dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900
						
						${isOpen ? 'bg-zinc-100 dark:bg-zinc-900' : ''}
						`}
					id="theme-menu-button"
					aria-expanded={isOpen}
					aria-haspopup="true"
				>
					<currentTheme.icon className="h-5 w-4 mr-1" />
					<ChevronDown className="-mr-1 ml-1 h-4 w-3" aria-hidden="true" />
					<span className="sr-only">Change theme</span>
				</button>
			</div>

			{isOpen && (
				<div
					className="absolute right-0 z-10 mt-1 w-32 border rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg text-xs"
					role="menu"
					aria-orientation="vertical"
					aria-labelledby="theme-menu-button"
				>
					<div className="py-1">
						{themeOptions.map((option) => (
							<button
								type="button"
								key={option.value}
								onClick={() => handleThemeChange(option.value)}
								className={`
                  ${
										theme === option.value
											? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
											: 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
									}
                  flex w-full items-center px-3 py-2 text-sm border-0 text-xs 
                `}
								role="menuitem"
							>
								<option.icon className="h-5 w-4 mr-4" />
								{option.text}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
