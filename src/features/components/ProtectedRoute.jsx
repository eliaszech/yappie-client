import { useAuth } from "../../hooks/useAuth.js";
import { Navigate } from "react-router-dom";
import { VoiceProvider } from "../../context/VoiceProvider.jsx";
import { UserPopupProvider } from "../../context/user/UserPopupProvider.jsx";
import SplashScreen from "./SplashScreen.jsx";

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
            <UserPopupProvider>
                {children}
            </UserPopupProvider>
        </VoiceProvider>
    );
}

export default ProtectedRoute;
