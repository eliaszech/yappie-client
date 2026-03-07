import {useLastPath} from "../../hooks/useLastPath.js";
import {Navigate} from "react-router-dom";

function LastPathRedirect({ pathKey, defaultPath }) {
    const { getPath } = useLastPath(pathKey, defaultPath);
    return <Navigate to={getPath()} replace />;
}
export default LastPathRedirect;