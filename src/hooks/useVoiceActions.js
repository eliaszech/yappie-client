import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onVoiceAction } from "../services/socket.js";
import { useVoice } from "./useVoice.jsx";

// Moderator actions arrive as one-shot events targeted at this user only:
// - voice:move      → leave current channel, join the target channel, route
//                     to the target's VoiceChannelView so the user sees where
//                     they ended up.
// - voice:disconnect → just leave
// Server enforces auth, so we trust the payload here.
export function useVoiceActions() {
    const voice = useVoice();
    const navigate = useNavigate();

    useEffect(() => {
        onVoiceAction((kind, data) => {
            if (kind === 'move') {
                if (!data?.channel || !data?.server) return;
                if (!voice?.channelId) return;
                if (data.fromChannelId && voice.channelId !== data.fromChannelId) return;
                voice.joinVoice({ channel: data.channel, server: data.server });
                // Surface the move visually — open the target channel's voice
                // view so the user immediately sees who else is in the room
                // they were just dragged into.
                navigate(`/servers/${data.server.id}/voice/${data.channel.id}`);
            } else if (kind === 'disconnect') {
                // Conversation-scoped force-leave (e.g. 1:1 hangup from the
                // other side) takes priority — channelId is only set on
                // moderator disconnect in server voice channels.
                if (data?.conversationId) {
                    if (voice?.conversationId !== data.conversationId) return;
                    voice.leaveVoice();
                    return;
                }
                if (!voice?.channelId) return;
                if (data?.channelId && voice.channelId !== data.channelId) return;
                voice.leaveVoice();
            }
        });
    }, [voice]);
}
