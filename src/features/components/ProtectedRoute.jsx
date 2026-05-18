import { useAuth } from "../../hooks/useAuth.js";
import { Navigate } from "react-router-dom";
import { VoiceProvider } from "../../context/VoiceProvider.jsx";
import { UserPopupProvider } from "../../context/user/UserPopupProvider.jsx";
import { ProfileModalProvider } from "../../context/user/ProfileModalProvider.jsx";
import SplashScreen from "./SplashScreen.jsx";
import { useIdleReporter } from "../../hooks/useIdleReporter.js";
import { useAfkMove } from "../../hooks/useAfkMove.js";

function VoiceEffects() {
    // Mounted inside VoiceProvider so the hooks can actually read voice state.
    useIdleReporter();
    useAfkMove();
    return null;
}

function ProtectedRoute({ children }) {
    const { user, loading, authError, retryCount, isReconnecting, retry, logout } = useAuth();

    if (loading || authError) {
        return (
            <SplashScreen
                loading={loading}
                authError={authError}
                retryCount={retryCount}
                isReconnecting={isReconnecting}
                onRetry={retry}
                onLogout={logout}
            />
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    return (
        <VoiceProvider>
            <VoiceEffects />
            <ProfileModalProvider>
                <UserPopupProvider>
                    {children}
                </UserPopupProvider>
            </ProfileModalProvider>
        </VoiceProvider>
    );
}

export default ProtectedRoute;
