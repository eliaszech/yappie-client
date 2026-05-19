import { useState } from 'react';
import { useVoice } from './useVoice.jsx';
import { useContextMenu } from './useContextMenu.js';
import { getStoredVolume, setStoredVolume } from '../services/participantVolume.js';
import { hasPermission, PERMISSIONS } from '../services/permissions.js';
import { moveVoiceUser, disconnectVoiceUser } from '../services/api.js';
import { faRightFromBracket, faArrowRight } from '@awesome.me/kit-95376d5d61/icons/classic/regular';

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

export function useParticipantContextMenu({ server, channels = [], currentChannelId } = {}) {
    const { setParticipantVolume } = useVoice();
    const { openContextMenu } = useContextMenu();

    return (e, participant) => {
        if (!participant || participant.isLocal) return;
        const name = participant.displayName ?? participant.name ?? participant.identity;
        const onVolume = (v) => {
            if (setParticipantVolume) setParticipantVolume(participant.identity, v);
            else setStoredVolume(participant.identity, v);
        };

        const items = [
            { header: true, label: name },
            {
                render: () => (
                    <VolumeSlider identity={participant.identity} onChange={onVolume} />
                ),
            },
        ];

        // Moderator actions: only show when the caller can manage channels on
        // this server and the participant is identified by user id.
        const canManage = hasPermission(server, PERMISSIONS.MANAGE_CHANNELS);
        const targetUserId = participant.identity;
        if (canManage && targetUserId) {
            const voiceTargets = channels
                .filter(c => c.type === 'voice' && c.id !== currentChannelId);

            if (voiceTargets.length > 0) {
                items.push({ separator: true });
                items.push({ header: true, label: 'Verschieben in' });
                for (const ch of voiceTargets) {
                    items.push({
                        label: ch.name,
                        icon: faArrowRight,
                        onClick: () => moveVoiceUser(targetUserId, ch.id),
                    });
                }
            }

            items.push({ separator: true });
            items.push({
                label: 'Aus Voice trennen',
                icon: faRightFromBracket,
                danger: true,
                onClick: () => disconnectVoiceUser(targetUserId),
            });
        }

        openContextMenu(e, items);
    };
}
