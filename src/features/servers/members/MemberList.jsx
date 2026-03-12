import ContentHeader from "../../components/ContentHeader.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import NoResultsMessage from "../../components/static/NoResultsMessage.jsx";

function MemberList() {


    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    <FontAwesomeIcon icon={faUsers} />
                    <span className="font-medium"> Mitglieder</span>
                </div>
            </ContentHeader>
            <div className="w-full h-full overflow-y-auto p-4">
                <div className="w-full h-max bg-guild-bar rounded-xl border border-border text-foreground">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-border">
                        Alle Mitglieder dieses Servers
                        <input type="text" placeholder="Nach Benutzername oder ID suchen"
                           className="bg-card text-sm w-[300px] rounded-md border border-border outline-none py-1 px-2 text-foreground focus:ring-2 focus:ring-primary placeholder:text-muted-foreground!" />
                    </div>
                    <div className="flex items-center justify-center h-[300px] border-b border-border">
                        <NoResultsMessage icon={<FontAwesomeIcon icon={faUsers} />} title="Keine Mitglieder" message="Es sind noch keine Mitglieder in diesem Server." />
                    </div>
                    <div className="flex justify-between text-muted-foreground items-center px-4 py-2">
                        0 Mitglieder
                    </div>
                </div>
            </div>
        </>
    )
}
export default MemberList;