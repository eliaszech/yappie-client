import {NavLink, useLocation} from "react-router-dom";
import {faAward, faPlus, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faMessages} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useTranslation} from "react-i18next";
import {useLastPath} from "../../hooks/useLastPath.js";
import {useEffect} from "react";
import ConversationList from "./friends/ConversationList.jsx";

function MessagesSidebar() {
    const {t} = useTranslation();
    const location = useLocation();
    const { savePath } = useLastPath('messages');

    useEffect(() => {
        savePath(location.pathname);
    }, [location.pathname]);

    return(
        <div className="h-full w-full bg-card rounded-tl-2xl border-l border-border flex flex-col grow overflow-y-auto pb-[65px]">
            <div className="px-2 h-12 flex items-center border-b-2 border-border shrink-0">
                <a href="#findOrStart"
                   className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all bg-muted/50 hover:bg-muted text-foreground">
                    Find or start a conversation</a>
            </div>
            <div className="py-3 px-2 flex flex-col gap-1">
                <NavLink to="/@me/friends" className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} w-full flex items-center gap-2.5 px-2 py-2 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon icon={faUsers} /> {t('messages.friends.title')}
                </NavLink>
                <NavLink to="/@me/quests" className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} w-full flex items-center gap-2.5 px-2 py-2 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                    <FontAwesomeIcon icon={faAward} /> {t('messages.quests')}
                </NavLink>
            </div>
            <div className="h-px bg-border w-full"></div>
            <ConversationList />
        </div>
    )
}

export default MessagesSidebar;