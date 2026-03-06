import MessagesSidebar from "../features/private/MessagesSidebar.jsx";
import { Outlet } from "react-router-dom";

function MessagesLayout() {
    return (
        <>
            <MessagesSidebar />
            <div className="w-full flex flex-col h-screen bg-background">
                <Outlet />
            </div>
        </>
    )
}

export default MessagesLayout