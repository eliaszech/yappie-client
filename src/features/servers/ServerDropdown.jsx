import {faTrash} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useRef} from "react";
import {deleteServer} from "../../services/api.js";
import {useQueryClient} from "@tanstack/react-query";
import {useAuth} from "../../hooks/useAuth.js";
import {useNavigate} from "react-router-dom";

export function ServerDropdown({server, closeDropdown}) {
    const {user} = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                closeDropdown();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [closeDropdown]);

    function handleDelete() {
        const res = deleteServer(server.id);

        if(res.status !== 400) {
            queryClient.setQueryData(['servers', user?.id], (old) => {
                if(!old) return old;

                return old.filter(s => s.id !== server.id);
            })

            navigate('/@me');
        }
    }

    return (
        <div ref={dropdownRef} className="absolute top-11.5 left-0  w-full">
            <div className="flex flex-col  bg-guild-bar divide-y divide-border rounded-b-lg border border-border text-foreground w-full">
                <button onClick={() => handleDelete()} className="cursor-pointer flex items-center gap-2 py-2.5 px-3 rounded-b-lg text-red-400 hover:bg-red-400/10 text-sm">
                    <FontAwesomeIcon icon={faTrash} />
                    Löschen
                </button>
            </div>
        </div>
    )
}

export default ServerDropdown;