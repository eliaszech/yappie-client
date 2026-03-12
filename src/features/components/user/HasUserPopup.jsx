import {useUserPopup} from "../../../hooks/user/useUserPopup.js";

function HasUserPopup({children, user}) {
    const { openPopup} = useUserPopup();

    return (
        <div className="group cursor-pointer" onClick={(e) => openPopup(user, e.currentTarget)}>
            {children}
        </div>
    )
}
export default HasUserPopup;