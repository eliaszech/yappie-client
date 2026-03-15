import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronRight, faCompass} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faUserPlus} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {fetchSearchUsers, sendFriendRequest} from "../../../services/api.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import {useAuth} from "../../../hooks/useAuth.js";
import {useQueryClient} from "@tanstack/react-query";
import NoResultsMessage from "../../components/static/NoResultsMessage.jsx";
import {getSocket} from "../../../services/socket.js";

function AddFriend() {
    const {user} = useAuth();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    async function searchUsers() {
        setIsLoading(true);
        const res = await fetchSearchUsers(input);

        setUsers(res);

        setIsLoading(false);
    }

    async function handleAddFriend(userId) {
        const socket = getSocket();
        if(!socket) return;

        const res = await sendFriendRequest(user.id, userId);

        if(res.status !== 400) {
            queryClient.setQueryData(['friends'], (old) => {
                if (!old) return old;

                return [...old, res];
            });

            socket.emit('friend:request', user.id, userId);
            navigate('/@me/friends/pending');
        }
    }

    return (
        <div>
            <div className="p-4 border-b border-border">
                <h3 className="text-base font-bold text-foreground mb-1">Add Friend</h3>
                <p className="text-sm text-muted-foreground mb-4">You can add friends with their username.</p>
                <div
                    className="flex items-center gap-2 p-1.5 rounded-md border border-border bg-card focus-within:ring-2 focus-within:ring-primary/80 transition-colors">
                    <input onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            searchUsers();
                        }
                    }} onChange={(e) => setInput(e.target.value)} type="text"
                        className="flex-1 bg-transparent px-3 py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground!"
                        placeholder="You can add friends with their username. e.g. CoolUser" />
                    <button onClick={searchUsers} disabled={input.length === 0} className="px-5 py-2 rounded cursor-pointer bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary transition-all shrink-0">
                        Suchen
                    </button>
                </div>

                <div className="mt-4 flex flex-col gap-1">
                    {users && users.length > 0 ? users.map((user) => (
                        <div key={user.id} className={`flex items-center group justify-between gap-3 px-2 py-1 rounded-md hover:bg-border transition duration-200`}>
                            <div className="flex items-center gap-3">
                                <UserAvatar icon={user.username.charAt(0).toUpperCase()} displayOnline={false} />
                                <div className="flex flex-col">
                                    <span className="text-foreground font-medium">{user.displayName ?? user.username}</span>
                                    <span className="text-muted-foreground text-xs">{user.username}</span>
                                </div>
                            </div>
                            <button onClick={() => handleAddFriend(user.id)} className="cursor-pointer text-sm group-hover:block hidden rounded-lg bg-primary text-primary-foreground px-2 py-1">
                                Freund hinzufügen
                            </button>
                        </div>
                    )) : (null)}
                </div>
            </div>
            <div className="p-4 border-b border-border">
                <h4 className="text-base font-semibold tracking-wide text-foreground mb-3">
                    Other Places to Make Friends</h4>
                <Link to="/discover"
                    className="w-[450px] cursor-pointer flex items-center gap-4 p-3 rounded-lg bg-card hover:bg-border border-2 border-border transition-colors group">
                    <div
                        className="w-10 h-10 rounded-full text-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={faCompass} />
                    </div>
                    <div className="text-left flex-1">
                        <div className="text-sm font-medium text-foreground">Explore Discoverable Servers</div>
                        <div className="text-xs text-muted-foreground">
                            Find communities based on your interests
                        </div>
                    </div>
                    <span
                        className="text-muted-foreground group-hover:text-foreground transition-colors text-lg">
                        <FontAwesomeIcon icon={faChevronRight} />
                    </span>
                </Link>

            </div>
            <div className="p-4">
                <h4 className="text-base font-semibold tracking-wide text-foreground mb-3">
                    People you may know</h4>
            </div>
        </div>
    )
}

export default AddFriend;