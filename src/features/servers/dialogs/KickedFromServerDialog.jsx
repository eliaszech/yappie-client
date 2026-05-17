import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonToDoor } from "@awesome.me/kit-95376d5d61/icons/classic/light";

function KickedFromServerDialog({ serverName, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-background rounded-xl border border-border shadow-2xl w-[28rem] overflow-hidden">
                <div className="flex flex-col items-center px-8 pt-8 pb-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 text-red-400 mb-4">
                        <FontAwesomeIcon icon={faPersonToDoor} className="text-3xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground text-center">
                        Aus Server entfernt
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 text-center leading-relaxed">
                        Du wurdest aus <b className="text-foreground">{serverName}</b> entfernt
                        und hast keinen Zugriff mehr auf die Kanäle und Mitglieder.
                    </p>
                </div>
                <div className="px-6 py-4 bg-card/40 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-6 py-2 text-sm rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                    >
                        Verstanden
                    </button>
                </div>
            </div>
        </div>
    );
}

export default KickedFromServerDialog;