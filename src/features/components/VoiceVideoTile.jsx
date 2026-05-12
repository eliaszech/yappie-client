import { useEffect, useRef } from "react";

function VoiceVideoTile({ track, muted = false, className = "" }) {
    const videoRef = useRef(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !track) return;
        track.attach(el);
        return () => { track.detach(el); };
    }, [track]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={`w-full h-full object-contain bg-black ${className}`}
        />
    );
}

export default VoiceVideoTile;