import {Outlet} from "react-router-dom";

function SidebarLayout() {
    return (
        <>
            <div className="w-full flex flex-col h-screen bg-background">
                <Outlet />
            </div>
        </>
    )
}

export default SidebarLayout