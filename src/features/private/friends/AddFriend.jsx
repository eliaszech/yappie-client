import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronRight, faCompass} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {Link} from "react-router-dom";

function AddFriend() {
    return (
        <div>
            <div className="p-4 border-b border-border">
                <h3 className="text-base font-bold text-foreground mb-1">Add Friend</h3>
                <p className="text-sm text-muted-foreground mb-4">You can add friends with their username.</p>
                <div
                    className="flex items-center gap-2 p-1.5 rounded-md border border-border bg-card focus-within:ring-2 focus-within:ring-primary/80 transition-colors">
                    <input type="text"
                        className="flex-1 bg-transparent px-3 py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground!"
                        placeholder="You can add friends with their username. e.g. CoolUser#1234" />
                    <button disabled className="px-5 py-2 rounded cursor-pointer bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary transition-all shrink-0">
                        Add Friend
                    </button>
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