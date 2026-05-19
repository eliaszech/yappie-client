import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const MobileLayoutContext = createContext(null);

const MOBILE_BREAKPOINT = 768;

export function MobileLayoutProvider({ children }) {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
    );
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const openLeft = useCallback(() => setLeftOpen(true), []);
    const closeLeft = useCallback(() => setLeftOpen(false), []);
    const toggleLeft = useCallback(() => setLeftOpen(v => !v), []);
    const openRight = useCallback(() => setRightOpen(true), []);
    const closeRight = useCallback(() => setRightOpen(false), []);
    const toggleRight = useCallback(() => setRightOpen(v => !v), []);

    const value = useMemo(() => ({
        isMobile,
        leftOpen, openLeft, closeLeft, toggleLeft,
        rightOpen, openRight, closeRight, toggleRight,
    }), [isMobile, leftOpen, rightOpen, openLeft, closeLeft, toggleLeft, openRight, closeRight, toggleRight]);

    return <MobileLayoutContext.Provider value={value}>{children}</MobileLayoutContext.Provider>;
}

export function useMobileLayout() {
    const ctx = useContext(MobileLayoutContext);
    if (!ctx) throw new Error('useMobileLayout must be used inside MobileLayoutProvider');
    return ctx;
}
