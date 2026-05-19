import {useLastPath} from "../../hooks/useLastPath.js";
import {Navigate, useLocation} from "react-router-dom";

function LastPathRedirect({ pathKey, defaultPath }) {
    const { getPath } = useLastPath(pathKey, defaultPath);
    const location = useLocation();
    // Layouts above us save the visited pathname on every render. During the
    // redirect chain the bare layout path (e.g. '/@me/friends') gets briefly
    // saved before the subsequent navigate updates it. If for any reason that
    // intermediate value sticks, getPath() would return our own URL and the
    // <Navigate /> would be a self-redirect — the user stays put. Falling back
    // to defaultPath whenever the saved target equals our current location
    // guarantees the redirect always advances.
    const target = getPath();
    const safeTarget = target === location.pathname ? defaultPath : target;
    return <Navigate to={safeTarget} replace />;
}
export default LastPathRedirect;