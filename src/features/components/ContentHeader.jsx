import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useMobileLayout } from "../../context/MobileLayoutContext.jsx";

function ContentHeader({ children }) {
    const { openLeft } = useMobileLayout();

    return (
        <div className="flex shrink-0 items-center justify-between bg-guild-bar h-12 px-3 md:px-4 border-b-2 border-border gap-3">
            <button
                onClick={openLeft}
                title="Menü öffnen"
                aria-label="Menü öffnen"
                className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
                <FontAwesomeIcon icon={faBars} />
            </button>
            {children}
        </div>
    );
}
export default ContentHeader;
