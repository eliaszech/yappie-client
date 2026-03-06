import { NavLink } from "react-router-dom";
import {faAward, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useTranslation} from "react-i18next";

function MessagesSidebar() {
    const {t} = useTranslation();

    return(
        <div className="max-w-xs w-full shrink-0 bg-card rounded-tl-xl flex flex-col h-screen">
            <div className="px-3 h-12 flex items-center">
                <a href="#findOrStart"
                   className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-all bg-muted/50 hover:bg-muted text-foreground">
                    Find or start a conversation</a>
            </div>
            <div className="h-px bg-border w-full"></div>
            <div className="py-3 px-3 flex flex-col gap-1">
                <NavLink to="/@me/friends" className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon icon={faUsers} /> {t('messages.friends')}
                </NavLink>
                <NavLink to="/@me/quests" className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon icon={faAward} /> {t('messages.quests')}
                </NavLink>
            </div>
            <div className="h-px bg-border w-full"></div>
        </div>
    )
}

export default MessagesSidebar;