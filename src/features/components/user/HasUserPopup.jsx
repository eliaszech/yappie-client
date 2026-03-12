import {useUserPopup} from "../../../hooks/user/useUserPopup.js";

function HasUserPopup({children, user, orientation = 'right'}) {
    const { openPopup } = useUserPopup();

    return (
        <div className="cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            openPopup(user, e.currentTarget, orientation)
        }}>
            {children}
        </div>
    )
}
export default HasUserPopup;