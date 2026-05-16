import { lazy, Suspense } from 'react';
import { useVoice } from '../../hooks/useVoice.jsx';

const VoiceRoomConnection = lazy(() => import('./VoiceRoomConnection.jsx'));

function GlobalVoiceComponent() {
    const { isConnected } = useVoice();
    if (!isConnected) return null;
    return (
        <Suspense fallback={null}>
            <VoiceRoomConnection />
        </Suspense>
    );
}

export default GlobalVoiceComponent;