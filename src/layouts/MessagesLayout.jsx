import MessagesSidebar from "../features/private/MessagesSidebar.jsx";
import {Navigate, Outlet, useLocation} from "react-router-dom";
import {useLastPath} from "../hooks/useLastPath.js";

function MessagesLayout() {
    return (
        <>
            <div className="w-full flex flex-col h-screen bg-background">
                <Outlet />
            </div>
        </>
    )
}

export default MessagesLayout