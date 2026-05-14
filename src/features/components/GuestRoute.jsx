import { useAuth } from "../../hooks/useAuth.js";
import { Navigate } from "react-router-dom";
import SplashScreen from "./SplashScreen.jsx";

function GuestRoute({ children }) {
    const { user, loading, retryCount } = useAuth();

    if (loading) {
        return <SplashScreen loading={true} authError={null} retryCount={retryCount} onRetry={() => {}} onLogout={() => {}} />;
    }

    if (user) return <Navigate to="/@me" replace />;

    return (
        <div className="h-screen flex justify-center items-center antialiased">
            {children}
        </div>
    );
}

export default GuestRoute;
