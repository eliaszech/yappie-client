import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {faTimes} from "@awesome.me/kit-95376d5d61/icons/classic/light";


function FriendsList({filter}) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/users')
            .then(response => response.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    }, [])

    const filteredUsers = users.filter(user => (user.online && filter === 'online' || filter === 'all') && user.username.toLowerCase().includes(search.toLowerCase()));

    const {t} = useTranslation();

    return (
        <>
            <div className="flex flex-col h-full overflow-hidden pt-4">
                <div className="relative flex items-center w-full mb-6 px-4">
                    <FontAwesomeIcon icon={faSearch}
                                     className="absolute left-7.5 pointer-events-none text-muted-foreground"/>
                    <input
                        className="pl-8 pr-2.5 py-1.5 w-full rounded border border-border outline-none bg-input text-sm focus:ring-2 focus:ring-primary/80 text-foreground placeholder:text-muted-foreground"
                        placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)}/>
                    <button onClick={() => setSearch('')}
                        className={`${search !== '' ? '' : 'hidden'} absolute right-8 rounded-full w-6 h-6 bg-transparent cursor-pointer text-muted-foreground hover:text-foreground transition-colors`}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="flex flex-col h-full overflow-y-auto scrollbar px-4">
                    <span
                        className="text-[11px] font-semibold uppercase tracking-wide text-foreground mb-2">
                        {t('messages.friends.filters.texts.' + filter.toLowerCase()) + ' - ' + filteredUsers.length}
                    </span>
                    {filteredUsers.length > 0 ? (
                        <div className="flex flex-col divide-y divide-border">
                            <AnimatePresence mode="popLayout">
                                {filteredUsers.map((user) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <div
                                            className="cursor-pointer flex items-center gap-3 px-2 py-3 rounded-md hover:bg-border transition duration-200">
                                            <div className="relative shrink-0">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div
                                                    className={`${user.online ? 'bg-online' : 'bg-offline'} absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background `}></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-medium">{user.username}</span>
                                                <span className="text-xs text-foreground/60">{user.online ? 'Online' : 'Offline'}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-foreground/80 text-base font-medium">
                                {filter === 'online' ? t('messages.friends.empty.online') : t('messages.friends.empty.all')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default FriendsList;