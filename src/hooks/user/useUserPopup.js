import { useContext } from 'react';
import {UserPopupContext} from "../../context/user/UserPopupContext.jsx";

export const useUserPopup = () => useContext(UserPopupContext);