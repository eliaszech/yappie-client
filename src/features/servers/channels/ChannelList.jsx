import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHashtag, faPlus, faGear, faChevronDown } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChannels, updateChannelPositions } from "../../../services/api.js";
import { NavLink, useParams } from "react-router-dom";
import VoiceChannel from "./VoiceChannel.jsx";
import { useRef, useState } from "react";
import CreateChannelDialog from "../dialogs/CreateChannelDialog.jsx";
import ChannelSettingsModal from "../settings/ChannelSettingsModal.jsx";
import { useVoice } from "../../../hooks/useVoice.jsx";
import { useChannelUnread } from "../../../hooks/useReadStates.js";
import { hasPermission, hasChannelPermission, PERMISSIONS } from "../../../services/permissions.js";

function TextChannelItem({ server, channel, onSettings, canManage }) {
    const { unreadCount, mentionCount } = useChannelUnread(channel.id);
    const hasUnread = unreadCount > 0;
    const badge = mentionCount > 99 ? '99+' : mentionCount;

    return (
        <div className="group relative flex items-center">
            <NavLink
                to={`/servers/${server.id}/channels/${channel.id}`}
                draggable={false}
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
            {canManage && (
                <button
                    onClick={() => onSettings(channel)}
                    className="absolute right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
                    title="Kanaleinstellungen"
                >
                    <FontAwesomeIcon icon={faGear} className="text-xs" />
                </button>
            )}
        </div>
    );
}

// Drop-zone wrapper around a channel row. Renders a top/bottom border when the
// row is the active drop target so users can predict where the dragged channel
// will land. Drag/drop is scoped per type bucket (text/voice) via `bucket`.
function DraggableChannelRow({ children, channelId, bucket, draggable, dragState, setDragState, onDropReorder }) {
    const isDragging = dragState.id === channelId;
    const showIndicator =
        dragState.bucket === bucket &&
        dragState.dropId === channelId &&
        dragState.id !== null &&
        dragState.id !== channelId;
    const indicatorClass = showIndicator
        ? (dragState.dropPosition === 'before' ? 'border-t-2 border-primary' : 'border-b-2 border-primary')
        : '';

    function handleDragStart(e) {
        if (!draggable) return;
        setDragState({ id: channelId, bucket, dropId: null, dropPosition: null });
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        if (!draggable || dragState.bucket !== bucket || dragState.id === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        setDragState(s => ({ ...s, dropId: channelId, dropPosition: before ? 'before' : 'after' }));
    }

    function handleDragEnd() {
        setDragState({ id: null, bucket: null, dropId: null, dropPosition: null });
    }

    function handleDrop(e) {
        if (!draggable || dragState.bucket !== bucket || dragState.id === null) return;
        e.preventDefault();
        const sourceId = dragState.id;
        const targetId = channelId;
        const position = dragState.dropPosition;
        setDragState({ id: null, bucket: null, dropId: null, dropPosition: null });
        if (sourceId === targetId) return;
        onDropReorder(sourceId, targetId, position);
    }

    return (
        <div
            draggable={draggable}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            className={`${indicatorClass} ${isDragging ? 'opacity-50' : ''}`}
        >
            {children}
        </div>
    );
}

function ChannelList({server}) {
    const [createDialog, setCreateDialog] = useState(null);
    const [settingsChannel, setSettingsChannel] = useState(null);
    const [collapsed, setCollapsed] = useState({ text: false, voice: false });
    const [dragState, setDragState] = useState({ id: null, bucket: null, dropId: null, dropPosition: null });
    const previousChannelsRef = useRef(null);
    const canManageChannels = hasPermission(server, PERMISSIONS.MANAGE_CHANNELS);
    const queryClient = useQueryClient();

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

    async function handleReorder(bucket, sourceId, targetId, position) {
        const bucketList = bucket === 'text' ? textChannels : voiceChannels;
        const fromIdx = bucketList.findIndex(c => c.id === sourceId);
        const toIdx = bucketList.findIndex(c => c.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const next = [...bucketList];
        const [moved] = next.splice(fromIdx, 1);
        // After removing the dragged item the target's index may shift left by
        // one — re-derive the insert position against the mutated array.
        const adjustedTo = next.findIndex(c => c.id === targetId);
        const insertAt = position === 'before' ? adjustedTo : adjustedTo + 1;
        next.splice(insertAt, 0, moved);

        if (next.every((c, i) => c.id === bucketList[i].id)) return;

        previousChannelsRef.current = channels;
        const otherBucket = bucket === 'text' ? voiceChannels : textChannels;
        queryClient.setQueryData(['channels', server.id], [...otherBucket, ...next]);

        const res = await updateChannelPositions(server.id, next.map(c => c.id));
        if (res?.error) {
            queryClient.setQueryData(['channels', server.id], previousChannelsRef.current);
        } else if (Array.isArray(res)) {
            queryClient.setQueryData(['channels', server.id], res);
        }
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
                    {canManageChannels && (
                        <button
                            onClick={() => setCreateDialog('text')}
                            className="hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted/50"
                            title="Textkanal erstellen"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    {visibleText.map((channel) => (
                        <DraggableChannelRow
                            key={channel.id}
                            channelId={channel.id}
                            bucket="text"
                            draggable={canManageChannels && !collapsed.text}
                            dragState={dragState}
                            setDragState={setDragState}
                            onDropReorder={(s, t, p) => handleReorder('text', s, t, p)}
                        >
                            <TextChannelItem server={server} channel={channel} onSettings={setSettingsChannel} canManage={hasChannelPermission(channel, server, PERMISSIONS.MANAGE_CHANNELS)} />
                        </DraggableChannelRow>
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
                    {canManageChannels && (
                        <button
                            onClick={() => setCreateDialog('voice')}
                            className="hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted/50"
                            title="Sprachkanal erstellen"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    {visibleVoice.map((channel) =>
                        <DraggableChannelRow
                            key={channel.id}
                            channelId={channel.id}
                            bucket="voice"
                            draggable={canManageChannels && !collapsed.voice}
                            dragState={dragState}
                            setDragState={setDragState}
                            onDropReorder={(s, t, p) => handleReorder('voice', s, t, p)}
                        >
                            <VoiceChannel
                                server={server}
                                channel={channel}
                                onSettings={setSettingsChannel}
                                canManage={hasChannelPermission(channel, server, PERMISSIONS.MANAGE_CHANNELS)}
                            />
                        </DraggableChannelRow>
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
