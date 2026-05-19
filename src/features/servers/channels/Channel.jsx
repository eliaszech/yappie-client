import ContentHeader from "../../components/ContentHeader.jsx";
import {useQuery} from "@tanstack/react-query";
import {useNavigate, useParams} from "react-router-dom";
import Spinner from "../../components/static/Spinner.jsx";
import {fetchChannel, fetchChannels} from "../../../services/api.js";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {faMessage} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHashtag} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useEffect, useRef, useState} from "react";
import MemberSidebarList from "./MemberSidebarList.jsx";
import {getSocket} from "../../../services/socket.js";
import MessageInput from "../../messages/components/MessageInput.jsx";
import Chat from "../../messages/components/Chat.jsx";
import PinsPopover from "../../messages/components/PinsPopover.jsx";
import SearchPopover from "../../messages/components/SearchPopover.jsx";

function Channel() {
    const {channelId} = useParams();
    const navigate = useNavigate();
    const [showMemberSidebar, setShowMemberSidebar] = useState(true);

    const {data: channel = {}, isLoading, isError} = useQuery({
        queryKey: ['channel', channelId],
        queryFn: () => fetchChannel(channelId),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })

    // Watch the (visibility-filtered) channels list. If this channel disappears
    // — because a moderator just denied VIEW_CHANNEL on a role we hold — kick
    // the user out to the members list. Voice channels intentionally keep the
    // active route so mods can still drag a user into a "hidden" voice room.
    const { data: serverChannels } = useQuery({
        queryKey: ['channels', channel?.serverId],
        queryFn: () => fetchChannels(channel.serverId),
        enabled: !!channel?.serverId,
        staleTime: 10 * 60 * 1000,
    });
    // Ref guard: invalidation can briefly retrigger this effect; without it
    // we'd fire navigate twice before the location change settled, which read
    // as flicker (loop with ServerRedirect's lastPath cache).
    const navigatedAwayRef = useRef(false);
    useEffect(() => {
        if (navigatedAwayRef.current) return;
        if (!channel?.id || !channel.serverId) return;
        if (!Array.isArray(serverChannels)) return;
        const stillVisible = serverChannels.some(c => c.id === channel.id);
        if (stillVisible) return;
        navigatedAwayRef.current = true;
        // Members page — neutral, always accessible, sidesteps ServerRedirect's
        // lastPath cache which would otherwise bounce us right back here.
        navigate(`/servers/${channel.serverId}/members`, { replace: true });
    }, [serverChannels, channel?.id, channel?.serverId, navigate]);

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
                <div className="ml-auto flex items-center gap-2">
                    <PinsPopover channelId={channel.id} />
                    <SearchPopover type="channel" roomId={channel.id} />
                    <button
                        onClick={() => setShowMemberSidebar(v => !v)}
                        title={showMemberSidebar ? 'Mitgliederliste ausblenden' : 'Mitgliederliste anzeigen'}
                        className={`flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-colors ${
                            showMemberSidebar ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        <FontAwesomeIcon icon={faUsers} />
                    </button>
                </div>
            </ContentHeader>
            <div className="flex h-full w-full overflow-hidden">
                <div className="flex flex-col w-full h-full relative">
                    <Chat type="channel" roomId={channel.id}>
                        <div className="flex flex-col px-8 text-foreground gap-2.5 pb-8">
                            <div className="text-5xl flex items-center justify-center rounded-full bg-muted w-[100px] h-[100px] mb-2"><FontAwesomeIcon icon={faHashtag} /></div>
                            <div className="text-4xl font-bold">Willkommen in #{channel.name}</div>
                            <div className="text-xl">Am anfang war nichts. Dann gab es #{channel.name}. Und es war gut</div>
                        </div>
                    </Chat>
                    <MessageInput type="channel" serverId={channel.serverId} roomId={channel.id} roomName={channel.name} />
                </div>
                {showMemberSidebar && (
                    <div className="max-w-xs w-full bg-card/70 h-full border-l border-border">
                        {/* Suppress the channel-scoped fetch if we've already
                            lost VIEW_CHANNEL (race between the lock and the
                            navigate-away effect). Backend would return 403. */}
                        <MemberSidebarList
                            serverId={channel.serverId}
                            channelId={Array.isArray(serverChannels) && serverChannels.some(c => c.id === channel.id) ? channel.id : undefined}
                        />
                    </div>
                )}
            </div>

        </>
    )
}

export default Channel;