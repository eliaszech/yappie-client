import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useParams} from "react-router-dom";
import ContentHeader from "../../components/ContentHeader.jsx";
import {useQuery} from "@tanstack/react-query";
import {fetchConversation} from "../../../services/api.js";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessage} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import Spinner from "../../components/static/Spinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";

function Conversation() {
    const { conversationId } = useParams();

    const { data: conversation = null, isLoading, isError } = useQuery( {
        queryKey: ['conversation', conversationId],
        queryFn: () => fetchConversation(conversationId),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    if (isLoading) return <Spinner size="w-10 h-10" />;

    if (isError) return <ErrorMessage message="Konversation konnte nicht geladen werden" icon={<FontAwesomeIcon icon={faMessage} />} />;

    const otherUsers = conversation.participants.filter(participant => participant.user.username !== 'Elias');
    const isSingle = otherUsers.length === 1;

    const conversationTitle = otherUsers.map(participant => participant.user.username).join(', ');

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-xl text-foreground gap-3">
                    <UserAvatar size="w-6 h-6" icon={ isSingle ? otherUsers[0].user.username.charAt(0).toUpperCase() : <FontAwesomeIcon icon={faUsers} /> } />
                    <span className="font-medium">{conversationTitle}</span>
                </div>
            </ContentHeader>
            <div className="flex h-full w-full">
                <div className="flex flex-col w-full h-full overflow-hidden">
                    <div className="flex grow flex-col gap-4 p-4">
                        { conversation.messages.map((message) => (
                            <div key={message.id} className="flex items-center gap-3">
                                <UserAvatar size="w-9 h-9" icon={message.user.username.charAt(0).toUpperCase()} />
                                <div className="flex flex-col">
                                    <span className="text-base text-foreground font-bold">{message.user.username}</span>
                                    <span className="text-base text-foreground">{message.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-1.5 pb-2">
                        <input type="text" className="w-full p-2 h-[56px] border text-foreground border-border outline-none rounded-md bg-input focus:ring-2 focus:ring-primary/80 transition-colors"
                               placeholder={`Nachricht an ${conversationTitle} schreiben...`} />
                    </div>
                </div>
                <div className="max-w-sm w-full bg-card/70 h-full"></div>
            </div>

        </>
    )
}
export default Conversation;