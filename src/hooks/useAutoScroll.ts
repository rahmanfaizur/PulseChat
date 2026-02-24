import { useState, useRef, useEffect, useCallback } from "react";

export function useAutoScroll(dependencies: any[]) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showNewMessages, setShowNewMessages] = useState(false);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
            setIsAtBottom(true);
            setShowNewMessages(false);
        }
    }, []);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;

        setIsAtBottom(atBottom);
        if (atBottom) {
            setShowNewMessages(false);
        }
    }, []);

    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        } else {
            setShowNewMessages(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    return { scrollRef, handleScroll, scrollToBottom, showNewMessages };
}
