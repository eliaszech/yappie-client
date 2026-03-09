import {faCog, faHeadset, faMicrophone, faSignOut} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import UserAvatar from "./UserAvatar.jsx";
import {useAuth} from "../../hooks/useAuth.js";
import {useNavigate} from "react-router-dom";
import {useQueryClient} from "@tanstack/react-query";

function UserPanel() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    function handleLogout() {
        logout();
        queryClient.clear();
        navigate('/login');
    }

    return(
        <div className="absolute bottom-2 left-2 w-[385px] z-10 bg-muted  backdrop-blur-md rounded-lg pl-1 pr-2 py-1 justify-between flex items-center">
            <div className="flex items-center gap-3 hover:bg-card px-2 grow py-1 rounded-lg cursor-pointer">
                <UserAvatar icon={user.username.charAt(0).toUpperCase()} avatar={user.avatar} online={user.online} />
                <div className="flex flex-col ">
                    <span className="text-foreground text-base font-medium">
                        {user.username}
                    </span>
                    <span className="text-muted-foreground text-xs">
                        {user.online ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button className="cursor-pointer rounded-lg  text-foreground/80 text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                    <FontAwesomeIcon icon={faMicrophone} />
                </button>
                <button className="cursor-pointer rounded-lg  text-foreground/80 text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                    <FontAwesomeIcon icon={faHeadset} />
                </button>
                <button className="cursor-pointer rounded-lg  text-foreground/80 text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                    <FontAwesomeIcon icon={faCog} />
                </button>
                <button onClick={handleLogout} className="cursor-pointer rounded-lg  text-xl text-dnd hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                    <FontAwesomeIcon icon={faSignOut} />
                </button>
            </div>
        </div>
    )
}

export default UserPanel;