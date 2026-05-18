import { useContext } from 'react';
import { ProfileModalContext } from '../../context/user/ProfileModalContext.jsx';

export const useProfileModal = () => useContext(ProfileModalContext);
