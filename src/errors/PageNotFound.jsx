import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFrown} from "@awesome.me/kit-95376d5d61/icons/classic/light";

function PageNotFound() {
    return (
        <div className="flex w-full h-screen items-center justify-center">
            <div className="flex h-full flex-col items-center justify-center p-8 gap-1">
                  <span className="text-muted-foreground text-6xl">
                      <FontAwesomeIcon icon={faFrown} />
                  </span>
                <span className="text-foreground text-xl font-bold">Seite nicht gefunden</span>
                <span className="text-muted-foreground text-lg text-center">Diese Seite konnte nicht gefunden werden.</span>
            </div>
        </div>
    )
}

export default PageNotFound;