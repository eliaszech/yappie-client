import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceSmile } from "@awesome.me/kit-95376d5d61/icons/classic/solid";

function EmojisSection({ server }) {
    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Emojis</h1>
            </div>

            <div className="max-w-[70%] py-4 px-4 w-full mx-auto flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                    Verwalte eigene Emojis für <span className="text-foreground font-medium">{server.name}</span>.
                </p>
                <div className="bg-card border border-border rounded-xl px-4 py-12 text-center text-sm text-muted-foreground">
                    <FontAwesomeIcon icon={faFaceSmile} className="text-3xl mb-2 opacity-50" />
                    <p className="font-medium text-foreground">Custom Emojis kommen bald.</p>
                    <p className="mt-1">Hier kannst du in Zukunft Emojis hochladen, umbenennen und entfernen.</p>
                </div>
            </div>
        </div>
    );
}

export default EmojisSection;
