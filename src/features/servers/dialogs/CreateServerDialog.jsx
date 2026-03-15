import MessageItem from "../../messages/components/MessageItem.jsx";
import {useAuth} from "../../../hooks/useAuth.js";
import Input from "../../components/static/Input.jsx";
import {useState} from "react";
import {createServer} from "../../../services/api.js";
import {useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";

function CreateServerDialog({onCancel}) {
    const {user} = useAuth();
    const [serverName, setServerName] = useState('');
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    async function handleCreateServer() {
        if(!serverName) return;

        const res = await createServer(serverName);

        if(res.status !== 400) {
            queryClient.setQueryData(['servers', user?.id], (old) => {
                if(!old) return old;

                return [...old, res];
            })

            onCancel();
            navigate('/servers/' + res.id);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
            <div className="relative bg-background rounded-lg border border-border shadow-xl w-125 p-6">
                <h3 className="text-2xl text-center font-semibold text-foreground">Deinen Server erstellen</h3>
                <div className="text-sm text-center text-muted-foreground mt-2">
                    Dein Server ist ein Ort, wo du mit Freunden und Bekannten chatten kannst.
                    Erstelle einen Server, um deine eigenen Nachrichten zu teilen und mit anderen zu kommunizieren.
                </div>
                <div className="flex flex-col gap-2 mt-6">
                    <Input setValue={setServerName} noLeftPadding={true} value={serverName} type="text" placeholder="Servername" className="w-full" />
                </div>
                <div className="flex justify-evenly gap-2 mt-6">
                    <button onClick={onCancel}
                            className="cursor-pointer w-full bg-card px-4 py-2 text-sm rounded-md text-foreground hover:bg-muted">
                        Abbrechen
                    </button>
                    <button onClick={handleCreateServer}
                            className={`cursor-pointer w-full px-4 py-2 text-sm rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/80`}>
                        Erstellen
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateServerDialog;
