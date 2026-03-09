import {useAuth} from "../../hooks/useAuth.js";
import Spinner from "./static/Spinner.jsx";
import {Navigate} from "react-router-dom";
import ErrorMessage from "./static/ErrorMessage.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {VoiceProvider} from "../../context/VoiceProvider.jsx";

function ProtectedRoute({ children }) {
    const { user, loading, error, logout } = useAuth();

    if (loading) return (
        <div className="h-screen flex justify-center items-center antialiased">
            <Spinner size="w-12 h-12"/>
        </div>
    );
    if(error) return (
        <div className="h-screen flex justify-center items-center antialiased">
            <ErrorMessage icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
                onRetry={() => {
                    logout();
                    window.location.reload();
                }} retryTitle="Logout"
                title="Error loading page" message="There was a problem loading the page. Please try again later." />
        </div>
    );

    if(!user) return <Navigate to="/login" replace />;

    return <VoiceProvider>{children}</VoiceProvider>;
}

export default ProtectedRoute;