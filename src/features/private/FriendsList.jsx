import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import ContentHeader from "../components/ContentHeader.jsx";
import {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {faTimes} from "@awesome.me/kit-95376d5d61/icons/classic/light";


function FriendsList() {
    const [filter, setFilter] = useState('online');
    const [search, setSearch] = useState('');

    const users = [
        {
            id: "550e8400-e29b-41d4-a716-446655440001",
            name: "Max Mueller",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440002",
            name: "Anna Schmidt",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440003",
            name: "Leon Weber",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440004",
            name: "Sophie Fischer",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440005",
            name: "Felix Becker",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440006",
            name: "Laura Hoffmann",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440007",
            name: "Noah Schulz",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440008",
            name: "Emma Wagner",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440009",
            name: "Paul Richter",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440010",
            name: "Mia Klein",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440011",
            name: "Lukas Meyer",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440012",
            name: "Hannah Koch",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440013",
            name: "Jonas Bauer",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440014",
            name: "Lena Wolf",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440015",
            name: "Tim Schröder",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440016",
            name: "Sarah Neumann",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440017",
            name: "David Schwarz",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440018",
            name: "Julia Zimmermann",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440019",
            name: "Ben Braun",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440020",
            name: "Marie Hofmann",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440021",
            name: "Elias Krüger",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440022",
            name: "Sophia Hartmann",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440023",
            name: "Jan Lange",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440024",
            name: "Emily Werner",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440025",
            name: "Moritz Schmitt",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440026",
            name: "Lisa Krause",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440027",
            name: "Nico Meier",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440028",
            name: "Clara Lehmann",
            status: "offline"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440029",
            name: "Simon Huber",
            status: "online"
        },
        {
            id: "550e8400-e29b-41d4-a716-446655440030",
            name: "Lea Maier",
            status: "offline"
        }
    ]

    const filteredUsers = users.filter(user => (user.status === filter || filter === 'all') && user.name.toLowerCase().includes(search.toLowerCase()));

    const {t} = useTranslation();

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-xl text-foreground gap-3">
                    <FontAwesomeIcon icon={faUsers}/>
                    <span className="font-medium">{t('messages.friends')}</span>
                    <div className="w-px h-5 bg-border"></div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setFilter('online')}
                            className={`${filter === 'online' ? 'text-foreground bg-muted font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'} cursor-pointer text-sm px-2 py-0.5 rounded-md transition-colors `}>
                            {t('messages.filter.online')}
                        </button>
                        <button onClick={() => setFilter('all')}
                            className={`${filter === 'all' ? 'text-foreground bg-muted font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'} cursor-pointer px-2 text-sm py-0.5 rounded-md transition-colors `}>
                            {t('messages.filter.all')}
                        </button>
                    </div>
                </div>
            </ContentHeader>
            <div className="flex flex-col h-full overflow-hidden pt-4">
                <div className="relative flex items-center w-full mb-6 px-6">
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
                <div className="flex flex-col h-full overflow-y-auto scrollbar px-6">
                    <span
                        className="text-[11px] font-semibold uppercase tracking-wide text-foreground mb-2">
                        {t('messages.filter.' + filter.toLowerCase()) + ' - ' + filteredUsers.length}
                    </span>
                    {filteredUsers.length > 0 ? (
                        <div className="flex flex-col divide-y divide-border">
                            <AnimatePresence mode="popLayout">
                                {filteredUsers.map((user) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div
                                            className="cursor-pointer flex items-center gap-3 px-2 py-2 hover:bg-muted/20 ">
                                            <div className="relative shrink-0">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div
                                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-online"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-medium">{user.name}</span>
                                                <span className="text-xs text-foreground/60">{user.status}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-foreground/80">Es wurde niemand mit diesem Filtereinstellungen gefunden.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default FriendsList;