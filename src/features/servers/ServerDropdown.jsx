import { faTrash, faGear } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { faUserPlus } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import InviteDialog from "./dialogs/InviteDialog.jsx";

export function ServerDropdown({ server, closeDropdown, onOpenSettings }) {
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                closeDropdown();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [closeDropdown]);

    return (
        <div ref={dropdownRef} className="absolute top-11.5 left-0 w-full">
            <div className="flex flex-col bg-guild-bar divide-y divide-border rounded-b-lg border border-border text-foreground w-full">
                <button
                    onClick={() => setInviteDialogOpen(true)}
                    className="cursor-pointer flex items-center gap-2 py-2.5 px-3 hover:bg-muted/50 text-foreground text-sm"
                >
                    <FontAwesomeIcon icon={faUserPlus} />
                    Zu Server einladen
                </button>
                <button
                    onClick={() => { closeDropdown(); onOpenSettings(); }}
                    className="cursor-pointer flex items-center gap-2 py-2.5 px-3 hover:bg-muted/50 text-foreground text-sm"
                >
                    <FontAwesomeIcon icon={faGear} />
                    Servereinstellungen
                </button>
            </div>
            {inviteDialogOpen && (
                <InviteDialog server={server} onCancel={() => setInviteDialogOpen(false)} />
            )}
        </div>
    );
}

export default ServerDropdown;
