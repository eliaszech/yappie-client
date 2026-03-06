import { NavLink } from "react-router-dom";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faPlus, faMessages, faSparkles } from "@awesome.me/kit-95376d5d61/icons/classic/regular";

function ServerSelector() {
    return (
        <div
            className="flex flex-col shrink-0 h-screen w-20 py-4 gap-2 items-center bg-guild-bar text-foreground">
            <NavLink to="/@me"
                className={({isActive}) => `${isActive ? 'text-primary-foreground bg-primary rounded-2xl' : 'text-muted-foreground bg-card rounded-full'} w-12 h-12 text-xl flex items-center hover:rounded-2xl hover:bg-primary hover:text-primary-foreground justify-center transition-all duration-200`}>
                <FontAwesomeIcon icon={faSparkles}/>
            </NavLink>
            <div className="w-8 h-px bg-border mb-1"></div>
            <a href="#" className="w-12 h-12 rounded-2xl text-lg bg-card text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all" title="Discover">
                <FontAwesomeIcon icon={faPlus}/>
            </a>
            <NavLink to="/dicover"
                     className={({isActive}) => `${isActive ? 'text-foreground bg-primary/80' : 'bg-card text-muted-foreground'} w-11 h-11 rounded-2xl text-lg  hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all`}>
                <FontAwesomeIcon icon={faMessages}/>
            </NavLink>
        </div>
    )
}

export default ServerSelector