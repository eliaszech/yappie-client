import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShield } from "@awesome.me/kit-95376d5d61/icons/classic/solid";

function ChannelPermissionsSection() {
    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Berechtigungen</h1>
            </div>

            <div className="max-w-[65%] py-4 px-4 w-full mx-auto">
                <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center gap-3 text-center">
                    <FontAwesomeIcon icon={faShield} className="text-4xl text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Kanalberechtigungen werden in einer zukünftigen Version verfügbar sein.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ChannelPermissionsSection;
