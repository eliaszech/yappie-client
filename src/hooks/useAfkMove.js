import { useEffect } from "react";
import { onAfkMove } from "../services/socket.js";
import { useVoice } from "./useVoice.jsx";

// When the backend signals "you've been idle too long, move to AFK", we just
// invoke joinVoice with the AFK channel. The token endpoint returns a token
// with canPublish=false for AFK rooms, so the user is force-muted automatically.
export function useAfkMove() {
    const voice = useVoice();

    useEffect(() => {
        onAfkMove((data) => {
            if (!data?.channel || !data?.server) return;
            if (!voice?.channelId) return;
            if (voice.channelId !== data.fromChannelId) return;
            voice.joinVoice({ channel: data.channel, server: data.server });
        });
    }, [voice]);
}
