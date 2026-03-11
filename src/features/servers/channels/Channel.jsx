import ContentHeader from "../../components/ContentHeader.jsx";
import {useQuery} from "@tanstack/react-query";
import {useParams} from "react-router-dom";
import Spinner from "../../components/static/Spinner.jsx";
import {fetchChannel} from "../../../services/api.js";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessage, faMessages} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHashtag} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useEffect, useRef} from "react";
import MessageItem from "../../messages/components/MessageItem.jsx";
import NoResultsMessage from "../../components/static/NoResultsMessage.jsx";
import MemberSidebarList from "./MemberSidebarList.jsx";
import {getSocket} from "../../../services/socket.js";
import MessageInput from "../../messages/components/MessageInput.jsx";

function Channel() {
    const {channelId} = useParams();
    const messagesEndRef = useRef(null);

    const {data: channel = {}, isLoading, isError} = useQuery({
        queryKey: ['channel', channelId],
        queryFn: () => fetchChannel(channelId),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.emit('join:channel',channelId);

        return () => {
            socket.emit('leave:channel', channelId);
        };
    }, [channelId]);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [channel?.messages]);

    function shouldGroupMessage(current, previous) {
        if (!previous) return false;
        if (current.userId !== previous.userId) return false;

        const timeDiff = new Date(current.createdAt) - new Date(previous.createdAt);
        const oneHour = 60 * 60 * 1000;

        return timeDiff < oneHour;
    }

    if(isLoading) return <Spinner size="w-10 h-10" />;
    if(isError) return <ErrorMessage message="Channel konnte nicht geladen werden" icon={<FontAwesomeIcon icon={faMessage} />} />;

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    <span className="font-medium"><FontAwesomeIcon icon={faHashtag} /> {channel.name}</span>
                </div>
            </ContentHeader>
            <div className="flex h-full w-full overflow-hidden">
                <div className="flex flex-col w-full h-full relative">
                    {channel.messages.length > 0 ? (
                        <div className="relative flex grow flex-col pt-4 pb-8 overflow-y-auto">
                            { channel.messages.map((message, index) => {
                                const previous = channel.messages[index - 1];
                                const isGrouped = shouldGroupMessage(message, previous);

                                return <MessageItem isGrouped={isGrouped} key={message.id} message={message} />
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <NoResultsMessage icon={<FontAwesomeIcon icon={faMessages} />} title="Keine Nachrichten" message="Es ist ziemlich leer hier. Schreibe die erste Nachricht."/>
                    )}
                    <div className="absolute z-2 bottom-[64px] left-0 w-full h-16 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
                    <MessageInput type="channel" roomId={channel.id} roomName={channel.name} />
                </div>
                <div className="max-w-xs w-full bg-card/70 h-full">
                    <MemberSidebarList serverId={channel.serverId} />
                </div>
            </div>

        </>
    )
}

export default Channel;