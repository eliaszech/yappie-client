import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHashtag, faPlus} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import ConversationItem from "../../private/friends/components/ConversationItem.jsx";
import {useQuery} from "@tanstack/react-query";
import {fetchChannels} from "../../../services/api.js";
import {NavLink} from "react-router-dom";

function ChannelList({server}) {
    const {data: channels = [], isError, isLoading} = useQuery({
        queryKey: ['channels', server.id],
        queryFn: () => fetchChannels(server.id),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    if(isLoading) return <div>Loading...</div>

    return (
        <div className="flex flex-col px-2">
            <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
                <span className="uppercase">Textkanäle</span>
                <button><FontAwesomeIcon icon={faPlus} /></button>
            </div>
            <div className="flex flex-col gap-1">
                {channels.map((channel) =>
                    <NavLink to={`/servers/${server.id}/channels/${channel.id}`} key={channel.id}
                         className={({isActive}) => `${isActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'} w-full flex items-center gap-2.5 px-2 py-1 rounded-md font-medium transition-all hover:text-foreground hover:bg-muted/50`}>
                        <FontAwesomeIcon icon={faHashtag} /> {channel.name}
                    </NavLink>
                )}
            </div>
        </div>
    );
}

export default ChannelList;