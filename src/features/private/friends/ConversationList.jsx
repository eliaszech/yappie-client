import {fetchConversations} from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessages} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {useQuery} from "@tanstack/react-query";
import {faPlus} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useAuth} from "../../../hooks/useAuth.js";
import ConversationItem from "./components/ConversationItem.jsx";

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
                {conversations.map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} />)}
            </div>
        </div>
    )
}
export default ConversationList;