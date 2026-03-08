import {useAuth} from "../../hooks/useAuth.js";
import Spinner from "./static/Spinner.jsx";
import {Navigate} from "react-router-dom";

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <Spinner size="w-12 h-12"/>;
    if(!user) return <Navigate to="/login" replace />;

    return children;
}

export default ProtectedRoute;