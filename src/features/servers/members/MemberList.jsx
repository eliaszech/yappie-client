import ContentHeader from "../../components/ContentHeader.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faHashtag, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";

function MemberList() {


    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    <span className="font-medium"><FontAwesomeIcon icon={faUsers} /> Mitglieder</span>
                </div>
            </ContentHeader>
        </>
    )
}
export default MemberList;