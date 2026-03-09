import {Navigate, useParams} from "react-router-dom";
import {useLastPath} from "../../hooks/useLastPath.js";

function ServerRedirect() {
    const { serverId } = useParams();
    const { getPath } = useLastPath(`server-${serverId}`, `/servers/${serverId}/members`);
    return <Navigate to={getPath()} replace />;
}

export default ServerRedirect;