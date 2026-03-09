import {NavLink, Outlet, useLocation, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {useLastPath} from "../../hooks/useLastPath.js";
import {useEffect} from "react";
import {useQuery} from "@tanstack/react-query";
import {fetchServer} from "../../services/api.js";
import Spinner from "../components/static/Spinner.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown, faUserPlus, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import ChannelList from "./channels/ChannelList.jsx";

function ServerSidebar() {
    const { serverId } = useParams();
    const {t} = useTranslation();
    const location = useLocation();
    const { savePath } = useLastPath(`server-${serverId}`);

    const { data: server = null, isLoading, isError } = useQuery( {
        queryKey: ['server', serverId],
        queryFn: () => fetchServer(serverId),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    useEffect(() => {
        savePath(location.pathname);
    }, [location.pathname]);

    if(isLoading) return <Spinner size="w-10 h-10" />

    return(
        <div className="max-w-xs min-w-xs w-full shrink-0 bg-card rounded-tl-2xl border-l border-border flex flex-col grow overflow-y-auto pb-[65px]">
            <div className="px-2 h-12 flex justify-between items-center border-b-2 border-border shrink-0 text-foreground">
                <button className="cursor-pointer font-bold flex items-center gap-2.5 hover:bg-muted/50 rounded-md px-2 py-1 transition-all">
                    {server.name} <FontAwesomeIcon className="text-xs" icon={faChevronDown} />
                </button>
                <button className="cursor-pointer font-bold flex text-sm items-center gap-2.5 hover:bg-muted/50 rounded-md px-2 py-1.5 transition-all">
                    <FontAwesomeIcon icon={faUserPlus} />
                </button>
            </div>
            <div className="py-4 px-2 flex flex-col gap-1">
                <NavLink to={`/servers/${serverId}/members`} className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} w-full flex items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon icon={faUsers} /> Mitglieder
                </NavLink>
            </div>
            <div className="h-px bg-border w-full"></div>
            <ChannelList server={server} />
        </div>
    )
}

export default ServerSidebar;