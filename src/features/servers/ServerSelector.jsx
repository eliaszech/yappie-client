import { NavLink } from "react-router-dom";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faPlus, faCompass, faSparkles } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useQuery} from "@tanstack/react-query";
import {useAuth} from "../../hooks/useAuth.js";
import {fetchServers} from "../../services/api.js";

function ServerSelector() {
    const { user } = useAuth();
    const {data: servers = [] , isError, isLoading} = useQuery({
        queryKey: ['servers', user?.id],
        queryFn: fetchServers,
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    return (
        <div className="flex flex-col h-full shrink-0 grow w-20 pt-4 gap-2 items-center bg-guild-bar text-foreground pb-[65px]">
            <NavLink to="/@me"
                     className={({isActive}) => `${isActive ? 'text-primary-foreground bg-primary' : 'text-muted-foreground bg-card'} w-12 h-12 rounded-2xl text-xl flex items-center hover:rounded-2xl hover:bg-primary hover:text-primary-foreground justify-center transition-all duration-200`}>
                <FontAwesomeIcon icon={faSparkles}/>
            </NavLink>
            {servers.length > 0 && (
                <div className="w-8 h-px bg-border mb-1"></div>
            )}
            {servers.length > 0 && servers.map((server) => (
                <NavLink to={`/servers/${server.id}`} key={server.id}
                         className={({isActive}) => `${isActive ? 'text-primary-foreground bg-primary' : 'text-muted-foreground bg-card'} w-12 h-12 rounded-2xl text-xl flex items-center hover:rounded-2xl hover:bg-primary hover:text-primary-foreground justify-center transition-all duration-200`}>
                    {server.name.charAt(0).toUpperCase()}
                </NavLink>
            ))}

            <div className="w-8 h-px bg-border mb-1"></div>
            <a href="#" className="w-12 h-12 rounded-2xl text-lg bg-card text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all" title="Discover">
                <FontAwesomeIcon icon={faPlus}/>
            </a>
            <NavLink to="/discover"
                     className={({isActive}) => `${isActive ? 'text-foreground bg-primary/80' : 'bg-card text-muted-foreground'} w-12 h-12 rounded-2xl text-xl  hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all`}>
                <FontAwesomeIcon icon={faCompass}/>
            </NavLink>
        </div>
    )
}

export default ServerSelector