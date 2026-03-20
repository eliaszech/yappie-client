
import {useQuery} from "@tanstack/react-query";
import {createInvite, fetchFriends, fetchOrCreateConversationWith} from "../../../services/api.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import {useEffect, useState} from "react";
import Spinner from "../../components/static/Spinner.jsx";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import NoResultsMessage from "../../components/static/NoResultsMessage.jsx";
import {getSocket} from "../../../services/socket.js";
import {useNavigate} from "react-router-dom";

function InviteFriendItem({friend, onInvite}) {
    return (
        <div className='cursor-pointer flex items-center justify-between gap-3 px-2 py-1 rounded-md hover:bg-border transition duration-200'>
            <div className="flex items-center gap-3">
                <UserAvatar icon={friend.username.charAt(0).toUpperCase()} displayOnline={false} />
                <div className="flex flex-col">
                    <span className="text-foreground font-medium">{friend.displayName ?? friend.username}</span>
                    <span className="text-xs text-muted-foreground">
                    {friend.username}
                </span>
                </div>
            </div>
            <button onClick={() => onInvite(friend.id)} className="bg-primary/10 text-primary px-3 py-1.5 text-sm rounded-lg hover:bg-primary/20 cursor-pointer transition duration-200">
                Einladen
            </button>
        </div>
    )
}

function InviteDialog({server, onCancel}) {
    const [search, setSearch] = useState('');
    const [invite, setInvite] = useState({});
    const navigate = useNavigate();

    const {data: friends, isLoading, error} = useQuery({
        queryKey: ['friends'],
        queryFn: () => fetchFriends(),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    useEffect(() => {
        async function fetchInvite() {
            const inviteObject = await createInvite(server.id);
            setInvite(inviteObject);
        }
        fetchInvite();
    }, [server])

    async function handleInvite(friendId) {
        const socket = getSocket();
        if (!socket) return;

        const conversation = await fetchOrCreateConversationWith(friendId);

        if(conversation && invite) {
            socket.emit('message:send', {
                text: 'yappie.gg/invite/' + invite.code,
                type: 'conversation',
                roomId: conversation.id,
                messageType: 'server_invite',
                inviteId: invite.id,
            })

            navigate(`/@me/messages/${conversation.id}`);
        }
    }

    const filteredUsers = friends?.filter(friend => friend.username.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
            <div className="relative bg-background rounded-lg border border-border shadow-xl w-125">
                <div className="p-6 border-b border-border">
                    <h3 className="text-xl font-semibold text-foreground">Freunde zu {server.name} einladen</h3>
                    <div className="text-sm text-muted-foreground mt-2">
                        Empfänger landen in #allgemein
                    </div>
                    <div className="gap-2 mt-6">
                        <input onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Nach Freunden suchen" className="w-full text-sm outline-none focus:ring-2 focus:ring-primary px-4 py-2.5 rounded-lg bg-card border border-border text-foreground" />
                    </div>
                    <div className="flex flex-col gap-2 mt-4 overflow-y-auto max-h-[450px]">
                        {!isLoading && filteredUsers?.map((friend) => (
                            <InviteFriendItem key={friend.id} friend={friend} onInvite={async (friendId) => await handleInvite(friendId)} />
                        ))}
                        {isLoading && (
                            <Spinner size="w-10 h-10" />
                        )}
                        {filteredUsers?.length === 0 && (
                            <NoResultsMessage title="Keine Freunde gefunden" message="Keine Freunde gefunden" icon={<FontAwesomeIcon icon={faUsers} />} />
                        )}
                    </div>
                </div>
                <div className="p-6">
                    <div className="text-foreground text-sm mb-4">
                        Oder schick einen Server-Einladungslink an einen Freund
                    </div>
                    <input type="text" value={`yappie.gg/invite/${invite?.code}`} readOnly={true} placeholder="Server-Einladungslink" className="w-full text-sm outline-none focus:ring-2 focus:ring-primary px-4 py-2.5 rounded-lg bg-card border border-border text-foreground" />
                </div>
            </div>
        </div>
    );
}

export default InviteDialog;
