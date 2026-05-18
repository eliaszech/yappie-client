import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faShield, faXmark, faTrash } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { deleteChannel } from "../../../services/api.js";
import ChannelOverviewSection from "./sections/ChannelOverviewSection.jsx";
import ChannelPermissionsSection from "./sections/ChannelPermissionsSection.jsx";

const NAV = [
    {
        category: 'KANALEINSTELLUNGEN',
        items: [
            { id: 'overview',     label: 'Übersicht',      icon: faGear },
            { id: 'permissions',  label: 'Berechtigungen', icon: faShield },
        ],
    },
];

function SectionContent({ section, channel, server }) {
    switch (section) {
        case 'overview':    return <ChannelOverviewSection channel={channel} server={server} />;
        case 'permissions': return <ChannelPermissionsSection channel={channel} />;
        default:            return <ChannelOverviewSection channel={channel} server={server} />;
    }
}

function ChannelSettingsModal({ channel, server, onClose }) {
    const [section, setSection] = useState('overview');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { channelId: activeChannelId } = useParams();

    useEffect(() => {
        const handle = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handle);
        return () => document.removeEventListener('keydown', handle);
    }, [onClose]);

    async function handleDelete() {
        const res = await deleteChannel(server.id, channel.id);

        if(!res?.error) {
            queryClient.setQueryData(['channels', server.id], (old) =>
                old ? old.filter(c => c.id !== channel.id) : old
            );
            queryClient.removeQueries({ queryKey: ['channel', channel.id] });
            onClose();
            if (activeChannelId === channel.id) {
                navigate(`/servers/${server.id}`);
            }
        }
    }

    return createPortal((
        <div className="fixed w-full h-full top-0 left-0 flex items-center justify-center z-[300]">
            <div onClick={onClose} className="absolute inset-0 bg-black opacity-60 z-[301] cursor-pointer" />
            <div className="rounded-lg w-full max-w-[80%] z-[302] h-full max-h-[85%] flex bg-background overflow-hidden">

                {/* Sidebar */}
                <div className="w-[280px] flex-shrink-0 bg-guild-bar overflow-y-auto flex flex-col">
                    <nav className="flex flex-col flex-1 py-4 px-4 gap-1">
                        <div className="px-2 pb-2 mb-1 border-b border-border">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                {channel.type === 'text' ? '#' : '🔊'} Kanal
                            </span>
                            <span className="text-sm font-bold text-foreground truncate block mt-0.5">
                                {channel.name}
                            </span>
                        </div>

                        {NAV.map((group, gi) => (
                            <div key={gi} className={`flex flex-col gap-1 ${gi > 0 ? 'mt-4' : 'mt-2'}`}>
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 mb-0.5">
                                    {group.category}
                                </div>
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSection(item.id)}
                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                                            section === item.id
                                                ? 'bg-muted text-foreground'
                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={item.icon} className="w-3.5 shrink-0" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        ))}

                        <div className="mt-auto pt-4 border-t border-border">
                            {server.afkChannelId === channel.id ? (
                                <div className="px-2 py-2 text-xs text-muted-foreground leading-snug">
                                    Dies ist der AFK-Kanal. Wähle in den Server-Einstellungen einen anderen aus, bevor du diesen löschst.
                                </div>
                            ) : confirmDelete ? (
                                <div className="flex flex-col gap-2 px-2 py-1">
                                    <span className="text-xs text-muted-foreground">Kanal wirklich löschen?</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="flex-1 text-xs py-1.5 rounded-md bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                                        >
                                            Abbrechen
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 text-xs py-1.5 rounded-md bg-dnd text-white hover:bg-dnd/80 cursor-pointer transition-colors"
                                        >
                                            Löschen
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md font-medium text-dnd hover:bg-dnd/10 transition-colors cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faTrash} className="w-3.5 shrink-0" />
                                    Kanal löschen
                                </button>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <SectionContent section={section} channel={channel} server={server} />
                    </div>

                    <div className="w-20 flex-shrink-0 flex flex-col items-center pt-4 px-4">
                        <button
                            onClick={onClose}
                            className="flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center group-hover:border-foreground transition-colors">
                                <FontAwesomeIcon icon={faXmark} className="text-muted-foreground group-hover:text-foreground transition-colors text-lg" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors tracking-wider">ESC</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ), document.body);
}

export default ChannelSettingsModal;
