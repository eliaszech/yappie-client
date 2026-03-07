import ContentHeader from "../../components/ContentHeader.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {Navigate, NavLink, Outlet, useLocation} from "react-router-dom";
import {t} from "i18next";
import {useLastPath} from "../../../hooks/useLastPath.js";
import {useEffect} from "react";

function FriendsLayout() {
    const location = useLocation();
    const { savePath } = useLastPath('friends')

    useEffect(() => {
        savePath(location.pathname);
    }, [location.pathname]);

    return(
        <>
            <ContentHeader>
                <div className="flex items-center text-xl text-foreground gap-3">
                    <FontAwesomeIcon icon={faUsers}/>
                    <span className="font-medium">{t('messages.friends.title')}</span>
                    <div className="w-px h-5 bg-border"></div>
                    <div className="flex items-center gap-2">
                        <NavLink to="/@me/friends/online"
                                className={({isActive}) => `${isActive ? 'text-foreground bg-muted font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'} cursor-pointer text-sm px-2 py-1 rounded-md transition-colors `}>
                            {t('messages.friends.filters.online')}
                        </NavLink>
                        <NavLink to="/@me/friends/all"
                                 className={({isActive}) => `${isActive ? 'text-foreground bg-muted font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'} cursor-pointer text-sm px-2 py-1 rounded-md transition-colors `}>
                            {t('messages.friends.filters.all')}
                        </NavLink>
                        <NavLink to="/@me/friends/add"
                            className={({isActive}) => `${isActive ? 'bg-voice text-primary-foreground' : 'bg-card text-foreground'} cursor-pointer px-2 text-sm py-1 font-medium rounded-sm transition-colors `}>
                            {t('messages.addFriend')}
                        </NavLink>
                    </div>
                </div>
            </ContentHeader>
            <Outlet />
        </>
    )
}
export default FriendsLayout;