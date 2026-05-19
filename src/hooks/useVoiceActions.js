import { useEffect } from "react";
import { onVoiceAction } from "../services/socket.js";
import { useVoice } from "./useVoice.jsx";

// Moderator actions arrive as one-shot events targeted at this user only:
// - voice:move      → leave current channel, join the target channel
// - voice:disconnect → just leave
// Server enforces auth, so we trust the payload here.
export function useVoiceActions() {
    const voice = useVoice();

    useEffect(() => {
        onVoiceAction((kind, data) => {
            if (kind === 'move') {
                if (!data?.channel || !data?.server) return;
                if (!voice?.channelId) return;
                if (data.fromChannelId && voice.channelId !== data.fromChannelId) return;
                voice.joinVoice({ channel: data.channel, server: data.server });
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
