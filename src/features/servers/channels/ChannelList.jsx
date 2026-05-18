import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHashtag, faPlus, faGear, faChevronDown } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import { useQuery } from "@tanstack/react-query";
import { fetchChannels } from "../../../services/api.js";
import { NavLink, useParams } from "react-router-dom";
import VoiceChannel from "./VoiceChannel.jsx";
import { useState } from "react";
import CreateChannelDialog from "../dialogs/CreateChannelDialog.jsx";
import ChannelSettingsModal from "../settings/ChannelSettingsModal.jsx";
import { useVoice } from "../../../hooks/useVoice.jsx";
import { useChannelUnread } from "../../../hooks/useReadStates.js";

function TextChannelItem({ server, channel, onSettings }) {
    const { unreadCount, mentionCount } = useChannelUnread(channel.id);
    const hasUnread = unreadCount > 0;
    const badge = mentionCount > 99 ? '99+' : mentionCount;

    return (
        <div className="group relative flex items-center">
            <NavLink
                to={`/servers/${server.id}/channels/${channel.id}`}
                className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : hasUnread ? 'text-foreground' : 'text-muted-foreground'} w-full flex items-center gap-2.5 px-2 py-1 pr-7 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}
            >
                {hasUnread && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-full bg-foreground" />
                )}
                <FontAwesomeIcon icon={faHashtag} className="shrink-0" />
                <span className={`truncate ${hasUnread ? 'font-semibold' : ''}`}>{channel.name}</span>
                {mentionCount > 0 && (
                    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-dnd text-white text-[10px] font-bold flex items-center justify-center">
                        {badge}
                    </span>
                )}
            </NavLink>
            <button
                onClick={() => onSettings(channel)}
                className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                title="Kanaleinstellungen"
            >
                <FontAwesomeIcon icon={faGear} className="text-xs" />
            </button>
        </div>
    );
}

function ChannelList({server}) {
    const [createDialog, setCreateDialog] = useState(null);
    const [settingsChannel, setSettingsChannel] = useState(null);
    const [collapsed, setCollapsed] = useState({ text: false, voice: false });

    const { channelId: activeRouteChannelId } = useParams();
    const { channelId: activeVoiceChannelId } = useVoice();

    const {data: channels = [], isLoading} = useQuery({
        queryKey: ['channels', server.id],
        queryFn: () => fetchChannels(server.id),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    if (isLoading) return <div>Loading...</div>

    const textChannels = channels.filter(c => c.type === 'text');
    const voiceChannels = channels.filter(c => c.type === 'voice');

    function isActive(channel) {
        return activeRouteChannelId === channel.id || activeVoiceChannelId === channel.id;
    }

    function toggle(type) {
        setCollapsed(prev => ({ ...prev, [type]: !prev[type] }));
    }

    const visibleText  = collapsed.text  ? textChannels.filter(isActive)  : textChannels;
    const visibleVoice = collapsed.voice ? voiceChannels.filter(isActive) : voiceChannels;

    return (
        <>
            <div className="flex flex-col px-2">
                {/* Textkanäle */}
                <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
                    <button
                        onClick={() => toggle('text')}
                        className="flex items-center gap-1.5 uppercase hover:text-foreground transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`text-[9px] transition-transform duration-200 ${collapsed.text ? '-rotate-90' : ''}`}
                        />
                        Textkanäle
                    </button>
                    <button
                        onClick={() => setCreateDialog('text')}
                        className="hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted/50"
                        title="Textkanal erstellen"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    {visibleText.map((channel) => (
                        <TextChannelItem key={channel.id} server={server} channel={channel} onSettings={setSettingsChannel} />
                    ))}
                </div>

                {/* Sprachkanäle */}
                <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
                    <button
                        onClick={() => toggle('voice')}
                        className="flex items-center gap-1.5 uppercase hover:text-foreground transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`text-[9px] transition-transform duration-200 ${collapsed.voice ? '-rotate-90' : ''}`}
                        />
                        Sprachkanäle
                    </button>
                    <button
                        onClick={() => setCreateDialog('voice')}
                        className="hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted/50"
                        title="Sprachkanal erstellen"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    {visibleVoice.map((channel) =>
                        <VoiceChannel
                            key={channel.id}
                            server={server}
                            channel={channel}
                            onSettings={setSettingsChannel}
                        />
                    )}
                </div>
            </div>

            {createDialog && (
                <CreateChannelDialog
                    serverId={server.id}
                    serverName={server.name}
                    initialType={createDialog}
                    onClose={() => setCreateDialog(null)}
                />
            )}

            {settingsChannel && (
                <ChannelSettingsModal
                    channel={settingsChannel}
                    server={server}
                    onClose={() => setSettingsChannel(null)}
                />
            )}
        </>
    );
}

export default ChannelList;
