import {fetchConversations} from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessages} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {useQuery} from "@tanstack/react-query";
import {faPlus, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import UserAvatar from "../../components/UserAvatar.jsx";
import {NavLink} from "react-router-dom";
import {useAuth} from "../../../hooks/useAuth.js";

function ConversationList() {
    const { user } = useAuth();

    const { data: conversations = [], isLoading, isError } = useQuery({
        queryKey: ['conversations', user?.id],
        queryFn: () => fetchConversations(user.id),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    if(isLoading) return <Spinner size="w-10 h-10" />

    if(isError) return <ErrorMessage message="Konversationen konnten nicht geladen werden" icon={<FontAwesomeIcon icon={faMessages} />} />

    return(
        <div className="flex flex-col px-3">
            <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
                <span className="uppercase">Direktnachrichten</span>
                <button><FontAwesomeIcon icon={faPlus} /></button>
            </div>
            <div className="flex flex-col gap-1">
                {conversations.map((conversation) => {
                    const conversationTitle = conversation.participants.map(participant => participant.user.username).join(', ');
                    return <NavLink to={`/@me/messages/${conversation.id}`} key={conversation.id}
                                    className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-foreground/80'} w-full flex items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all  hover:text-foreground hover:bg-muted/50`}>
                        <UserAvatar online={conversation.participants.length === 1 ? conversation.participants[0].user.online : null} icon={<FontAwesomeIcon icon={faUsers} />} />
                        <div className="flex flex-col">
                            <span className="text-sm">{conversationTitle}</span>
                            {conversation.messages[0] !== undefined ? (
                                <span className="text-muted-foreground text-xs">{conversation.messages[0].text}</span>
                            ) : null}

                        </div>
                    </NavLink>
                })}
            </div>
        </div>
    )
}
export default ConversationList;