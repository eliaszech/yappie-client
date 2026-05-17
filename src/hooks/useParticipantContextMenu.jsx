import { useState } from 'react';
import { useVoice } from './useVoice.jsx';
import { useContextMenu } from './useContextMenu.js';
import { getStoredVolume, setStoredVolume } from '../services/participantVolume.js';

function VolumeSlider({ identity, onChange }) {
    const [volume, setVolume] = useState(() => getStoredVolume(identity, 1));

    function handleChange(e) {
        const v = Number(e.target.value);
        setVolume(v);
        onChange(v);
    }

    return (
        <div className="flex flex-col gap-1.5 py-0.5 min-w-[180px]">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Lautstärke</span>
                <span className="text-foreground tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={volume}
                onChange={handleChange}
                className="w-full accent-primary cursor-pointer"
            />
        </div>
    );
}

export function useParticipantContextMenu() {
    const { setParticipantVolume } = useVoice();
    const { openContextMenu } = useContextMenu();

    return (e, participant) => {
        if (!participant || participant.isLocal) return;
        const name = participant.displayName ?? participant.name ?? participant.identity;
        const onChange = (v) => {
            if (setParticipantVolume) setParticipantVolume(participant.identity, v);
            else setStoredVolume(participant.identity, v);
        };
        openContextMenu(e, [
            { header: true, label: name },
            {
                render: () => (
                    <VolumeSlider identity={participant.identity} onChange={onChange} />
                ),
            },
        ]);
    };
}