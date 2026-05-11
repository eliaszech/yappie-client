import {useUserPopup} from "../../../hooks/user/useUserPopup.js";

function HasUserPopup({children, user, isProfilePopup = false, orientation = 'right', classes = '', roles = null}) {
    const { openPopup } = useUserPopup();

    return (
        <div className={`cursor-pointer ${classes}`} onClick={(e) => {
            e.stopPropagation();
            openPopup(user, isProfilePopup, e.currentTarget, orientation, roles)
        }}>
            {children}
        </div>
    )
}
export default HasUserPopup;