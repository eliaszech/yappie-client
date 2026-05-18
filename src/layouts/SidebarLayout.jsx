import {Outlet} from "react-router-dom";

function SidebarLayout() {
    return (
        <>
            <div className="w-full flex flex-col h-screen" style={{ background: 'var(--gradient-app)' }}>
                <Outlet />
            </div>
        </>
    )
}

export default SidebarLayout