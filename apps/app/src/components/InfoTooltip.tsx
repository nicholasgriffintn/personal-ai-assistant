import { type FC, useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
	content: React.ReactNode;
	className?: string;
	buttonClassName?: string;
	tooltipClassName?: string;
}

export const InfoTooltip: FC<InfoTooltipProps> = ({
	content,
	className = '',
	buttonClassName = 'p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400',
	tooltipClassName = 'w-80 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg',
}) => {
	const [showInfo, setShowInfo] = useState(false);
	const [position, setPosition] = useState<'top' | 'bottom'>('top');
	const buttonRef = useRef<HTMLButtonElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (showInfo && buttonRef.current && tooltipRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const spaceAbove = buttonRect.top;
			const spaceBelow = window.innerHeight - buttonRect.bottom;
			
			setPosition(spaceAbove > spaceBelow ? 'top' : 'bottom');
		}
	}, [showInfo]);

	return (
		<div className={`relative inline-flex ${className}`}>
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setShowInfo(!showInfo)}
				className={buttonClassName}
				aria-label="Show information"
				aria-expanded={showInfo}
			>
				<Info className="h-4 w-4" />
			</button>
			{showInfo && (
				<div 
					ref={tooltipRef}
					className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 z-50 ${tooltipClassName}`}
					role="tooltip"
				>
					{content}
				</div>
			)}
		</div>
	);
}; 