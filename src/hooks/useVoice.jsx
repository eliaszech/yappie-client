import { useContext } from 'react';
import { VoiceContext } from '../context/VoiceContext';

export const useVoice = () => useContext(VoiceContext);