import { useEffect, useRef, useCallback } from "react";

interface AutoscrollOptions {
	threshold?: number;
	behavior?: ScrollBehavior;
	disabled?: boolean;
}

export const useAutoscroll = ({
	threshold = 200,
	behavior = "smooth",
	disabled = false,
}: AutoscrollOptions = {}) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const shouldAutoScrollRef = useRef(true);

	const handleScroll = useCallback(() => {
		const container = messagesContainerRef.current;
		if (!container) {
			return;
		}

		const { scrollHeight, clientHeight, scrollTop } = container;

		const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
		shouldAutoScrollRef.current = distanceFromBottom <= threshold;
	}, [threshold]);

	useEffect(() => {
		const container = messagesContainerRef.current;
		if (!container) {
			return;
		}

		handleScroll();

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, [handleScroll]);

	const scrollToBottom = useCallback(() => {
		if (disabled || !shouldAutoScrollRef.current) {
			return;
		}

		const container = messagesContainerRef.current;
		const endElement = messagesEndRef.current;

		if (!container || !endElement) {
			return;
		}

		try {
			endElement.scrollIntoView({ behavior });
		} catch (error) {
			container.scrollTop = container.scrollHeight;
		}
	}, [behavior, disabled]);

	const forceScrollToBottom = useCallback(() => {
		const container = messagesContainerRef.current;
		const endElement = messagesEndRef.current;

		if (!container || !endElement || disabled) {
			return;
		}

		try {
			endElement.scrollIntoView({ behavior });
		} catch (error) {
			container.scrollTop = container.scrollHeight;
		}
	}, [behavior, disabled]);

	const isAtBottom = useCallback(() => {
		const container = messagesContainerRef.current;
		if (!container) {
			return false;
		}

		const { scrollHeight, clientHeight, scrollTop } = container;

		return scrollHeight - clientHeight - scrollTop <= threshold;
	}, [threshold]);

	return {
		messagesEndRef,
		messagesContainerRef,
		scrollToBottom,
		forceScrollToBottom,
		isAtBottom,
	};
};
