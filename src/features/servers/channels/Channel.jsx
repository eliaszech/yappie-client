import ContentHeader from "../../components/ContentHeader.jsx";
import {useQuery} from "@tanstack/react-query";
import {useParams} from "react-router-dom";
import Spinner from "../../components/static/Spinner.jsx";
import {fetchChannel} from "../../../services/api.js";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessage} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHashtag} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useEffect} from "react";
import MemberSidebarList from "./MemberSidebarList.jsx";
import {getSocket} from "../../../services/socket.js";
import MessageInput from "../../messages/components/MessageInput.jsx";
import Chat from "../../messages/components/Chat.jsx";

function Channel() {
    const {channelId} = useParams();

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

    if(isLoading) return <Spinner size="w-10 h-10" />;
    if(isError) return <ErrorMessage message="Channel konnte nicht geladen werden" icon={<FontAwesomeIcon icon={faMessage} />} />;

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    <FontAwesomeIcon icon={faHashtag} />
                    <span className="font-medium">{channel.name}</span>
                </div>
            </ContentHeader>
            <div className="flex h-full w-full overflow-hidden">
                <div className="flex flex-col w-full h-full relative">
                    <Chat messages={channel.messages} >
                        <div className="flex flex-col px-8 text-foreground gap-2.5 pb-8">
                            <div className="text-5xl flex items-center justify-center rounded-full bg-muted w-[100px] h-[100px] mb-2"><FontAwesomeIcon icon={faHashtag} /></div>
                            <div className="text-4xl font-bold">Willkommen in #{channel.name}</div>
                            <div className="text-xl">Am anfang war nichts. Dann gab es #{channel.name}. Und es war gut</div>
                        </div>
                    </Chat>
                    <div className="absolute z-2 bottom-[64px] left-0 w-full h-16 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
                    <MessageInput type="channel" roomId={channel.id} roomName={channel.name} />
                </div>
                <div className="max-w-xs w-full bg-card/70 h-full border-l border-border">
                    <MemberSidebarList serverId={channel.serverId} />
                </div>
            </div>

        </>
    )
}

export default Channel;