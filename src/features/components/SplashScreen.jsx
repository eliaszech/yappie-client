import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation, faLock, faArrowsRotate } from '@awesome.me/kit-95376d5d61/icons/classic/solid';

const MAX_RETRIES = 3;
const AUTO_RETRY_SECONDS = 60;

const errorTitles = {
    offline: 'Keine Verbindung',
    server_error: 'Serverfehler',
    expired: 'Sitzung abgelaufen',
};

const errorDescriptions = {
    offline: 'Yappie konnte keine Verbindung zum Server herstellen. Bitte überprüfe deine Internetverbindung.',
    server_error: 'Der Server hat unerwartet geantwortet. Bitte versuche es später erneut.',
    expired: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
};

function SplashScreen({ loading, authError, retryCount, isReconnecting, onRetry, onLogout }) {
    const [slowMessage, setSlowMessage] = useState(false);
    const [countdown, setCountdown] = useState(AUTO_RETRY_SECONDS);
    const [shouldAutoRetry, setShouldAutoRetry] = useState(false);
    const onRetryRef = useRef(onRetry);

    // Keep ref current so countdown effect doesn't go stale
    useEffect(() => { onRetryRef.current = onRetry; });

    // Slow-connection message (only on initial connect, not retrying)
    useEffect(() => {
        if (!loading || retryCount > 0) {
            setSlowMessage(false);
            return;
        }
        const t = setTimeout(() => setSlowMessage(true), 6000);
        return () => clearTimeout(t);
    }, [loading, retryCount]);

    // Countdown auto-retry — only active in error state (non-expired)
    useEffect(() => {
        const inErrorState = !!authError && !loading && authError !== 'expired';
        if (!inErrorState) {
            setCountdown(AUTO_RETRY_SECONDS);
            return;
        }
        if (countdown <= 0) {
            setShouldAutoRetry(true);
            setCountdown(AUTO_RETRY_SECONDS);
            return;
        }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [authError, loading, countdown]);

    // Trigger auto-retry outside of state updater (keeps setState pure)
    useEffect(() => {
        if (!shouldAutoRetry) return;
        setShouldAutoRetry(false);
        onRetryRef.current();
    }, [shouldAutoRetry]);

    const isError = !!authError;
    const isExpired = authError === 'expired';

    function getLoadingMessage() {
        if (retryCount > 0) return `Erneut verbinden… (${retryCount}/${MAX_RETRIES})`;
        if (isReconnecting) return 'Verbindung unterbrochen. Wird wiederhergestellt…';
        if (slowMessage) return 'Verbindung dauert länger als erwartet…';
        return 'Verbindung wird hergestellt…';
    }

    return (
        <div className="h-screen bg-background flex flex-col items-center justify-center gap-6 select-none">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
                <div className={`w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center text-primary font-black text-4xl border border-primary/20 ${loading ? 'animate-pulse' : ''}`}>
                    Y
                </div>
                <span className="text-2xl font-bold text-foreground tracking-tight">yappie</span>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-48 h-[3px] bg-muted/40 rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 w-2/5 bg-primary rounded-full splash-loading-bar" />
                    </div>
                    <p className="text-sm text-muted-foreground">{getLoadingMessage()}</p>
                </div>
            )}

            {/* Error state */}
            {isError && (
                <div className="flex flex-col items-center gap-4 max-w-xs text-center">

                    <div>
                        <h2 className="text-base font-semibold text-foreground mb-1">
                            {errorTitles[authError]}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {errorDescriptions[authError]}
                        </p>
                    </div>

                    <div className="flex gap-2 mt-1">
                        {!isExpired && (
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors font-medium"
                            >
                                <FontAwesomeIcon icon={faArrowsRotate} />
                                Erneut versuchen
                            </button>
                        )}
                        <button
                            onClick={onLogout}
                            className={`px-5 py-2 text-sm rounded-lg cursor-pointer transition-colors font-medium ${
                                isExpired
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                        >
                            {isExpired ? 'Zur Anmeldung' : 'Abmelden'}
                        </button>
                    </div>

                    {/* Auto-retry countdown (not shown for expired sessions) */}
                    {!isExpired && (
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Automatisch erneut versuchen in {countdown}s…
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SplashScreen;
