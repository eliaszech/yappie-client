import {NavLink, useLocation} from "react-router-dom";
import {faAward, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useTranslation} from "react-i18next";
import {useLastPath} from "../../hooks/useLastPath.js";
import {useEffect, useState} from "react";
import ConversationList from "./friends/ConversationList.jsx";
import NewConversationDialog from "./friends/NewConversationDialog.jsx";

function MessagesSidebar() {
    const {t} = useTranslation();
    const location = useLocation();
    const { savePath } = useLastPath('messages');
    const [newDialogOpen, setNewDialogOpen] = useState(false);

    useEffect(() => {
        savePath(location.pathname);
    }, [location.pathname]);

    return(
        <div className="h-full w-full bg-card/85 rounded-tl-2xl border-l border-border flex flex-col grow overflow-y-auto pb-[65px]">
            <div className="px-2 h-12 flex items-center border-b-2 border-border shrink-0 bg-guild-bar/85">
                <button
                    onClick={() => setNewDialogOpen(true)}
                    className="w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all bg-muted/50 hover:bg-muted text-foreground cursor-pointer"
                >
                    Find or start a conversation
                </button>
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
            <ConversationList onNewConversation={() => setNewDialogOpen(true)} />
            {newDialogOpen && <NewConversationDialog onClose={() => setNewDialogOpen(false)} />}
        </div>
    )
}

export default MessagesSidebar;