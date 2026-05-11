import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHashtag, faPlus } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import { useQuery } from "@tanstack/react-query";
import { fetchChannels } from "../../../services/api.js";
import { NavLink } from "react-router-dom";
import VoiceChannel from "./VoiceChannel.jsx";
import { useState } from "react";
import CreateChannelDialog from "../dialogs/CreateChannelDialog.jsx";

function ChannelList({server}) {
    const [createDialog, setCreateDialog] = useState(null); // 'text' | 'voice' | null

    const {data: channels = [], isLoading} = useQuery({
        queryKey: ['channels', server.id],
        queryFn: () => fetchChannels(server.id),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    if (isLoading) return <div>Loading...</div>

    const textChannels = channels.filter(c => c.type === 'text');
    const voiceChannels = channels.filter(c => c.type === 'voice');

    return (
        <>
            <div className="flex flex-col px-2">
                <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
                    <span className="uppercase">Textkanäle</span>
                    <button
                        onClick={() => setCreateDialog('text')}
                        className="hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted/50"
                        title="Textkanal erstellen"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    {textChannels.map((channel) =>
                        <NavLink to={`/servers/${server.id}/channels/${channel.id}`} key={channel.id}
                             className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} w-full flex items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                            <FontAwesomeIcon icon={faHashtag} /> {channel.name}
                        </NavLink>
                    )}
                </div>

                <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
                    <span className="uppercase">Sprachkanäle</span>
                    <button
                        onClick={() => setCreateDialog('voice')}
                        className="hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted/50"
                        title="Sprachkanal erstellen"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    {voiceChannels.map((channel) =>
                        <VoiceChannel key={channel.id} server={server} channel={channel} />
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
        </>
    );
}

export default ChannelList;
