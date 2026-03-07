import {faCog, faHeadset, faMicrophone} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function UserPanel() {
    return(
        <div className="absolute bottom-2 left-2 w-[385px] z-10 bg-muted/50 backdrop-blur-md rounded-lg pl-1 pr-2 py-1 justify-between flex items-center">
            <div className="flex items-center gap-3 hover:bg-card px-2 py-1 rounded-lg cursor-pointer">
                <div className="relative shrink-0">
                    <div
                        className="w-8 h-8 rounded-full bg-idle flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        C
                    </div>
                    <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-dnd border-2 border-guild-bar"></div>
                </div>
                <div className="flex flex-col ">
                    <span className="text-foreground text-base font-medium">
                        Concado
                    </span>
                    <span className="text-muted-foreground text-xs">
                        Bitte nicht stören
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button className="cursor-pointer rounded-lg  text-foreground/80 text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                    <FontAwesomeIcon icon={faMicrophone} />
                </button>
                <button className="cursor-pointer rounded-lg  text-foreground/80 text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                    <FontAwesomeIcon icon={faHeadset} />
                </button>
                <button className="cursor-pointer rounded-lg  text-foreground/80 text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                    <FontAwesomeIcon icon={faCog} />
                </button>
            </div>
        </div>
    )
}

export default UserPanel;