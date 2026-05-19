import {
    faCog,
    faHeadset,
    faMicrophone,
    faWaveform,
    faWireless,
    faArrowsRotate, faGamepadModern,
} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import UserAvatar from "./UserAvatar.jsx";
import {useAuth} from "../../hooks/useAuth.js";
import {useVoice} from "../../hooks/useVoice.jsx";
import {faMicrophoneSlash, faPhoneSlash, faHeadphonesSlash} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import HasUserPopup from "./user/HasUserPopup.jsx";
import StatusText from "./user/StatusText.jsx";
import {useIsOnline, useUserStatus} from "../../hooks/usePresence.js";
import {useUserActivity, useActivityPlaytime} from "../../hooks/useActivity.js";
import {useSettings} from "../../context/SettingsContext.jsx";
import {faGamepad} from "@awesome.me/kit-95376d5d61/icons/classic/solid";

function UserPanel() {
    const { user } = useAuth();
    const { openSettings } = useSettings();
    const { isConnected, channelName, serverName, conversationName, conversationId, krisp, leaveVoice, muted, toggleMute, deafened, toggleDeafen, connectionStatus, retryCount, isAfk } = useVoice();
    const callLabel = conversationId
        ? (conversationName ? `Anruf · ${conversationName}` : 'Anruf')
        : `${channelName} / ${serverName}`;

    const online = useIsOnline(user.id) ?? user.online;
    const status = useUserStatus(user.id) ?? user.status;
    const activity = useUserActivity(user.id);
    const showActivity = online && activity?.name;
    const playtimeLabel = useActivityPlaytime(activity?.since);

    function toggleKrisp() {
        if (!krisp) return;

        const newValue = !krisp.isNoiseFilterEnabled;
        krisp.setNoiseFilterEnabled(newValue);
        localStorage.setItem('krisp-enabled', newValue.toString());
    }

    return(
        <div className="absolute bottom-2 left-2 w-[385px] z-10 bg-muted  backdrop-blur-md rounded-lg  justify-between flex flex-col">
            {showActivity && (
                <div className="px-3 py-2 border-b border-border">
                    <div className="flex items-center gap-3">
                        {activity.icon ? (
                            <img src={activity.icon} alt="" className="w-8 h-8 shrink-0 rounded-lg object-cover" />
                        ) : (
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                                <FontAwesomeIcon icon={faGamepadModern} className="text-base" />
                            </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className=" font-semibold text-foreground truncate" title={activity.name}>{activity.name}</span>
                            {playtimeLabel && (
                                <div className="flex items-center gap-1 text-primary">
                                    <FontAwesomeIcon className="text-sm" icon={faGamepadModern} />
                                    <span className="text-[11px] text-primary truncate">{playtimeLabel}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {(isConnected || connectionStatus === 'connecting') && (
                <div className="pl-3 pr-2 py-2 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            {connectionStatus === 'connecting' ? (
                                <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
                                    {retryCount > 0 ? `Verbinde... (${retryCount}/5)` : 'Verbinde...'}
                                </span>
                            ) : connectionStatus === 'reconnecting' ? (
                                <span className="font-semibold text-yellow-400 flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faArrowsRotate} className="animate-spin" />
                                    {retryCount > 0 ? `Neuverbindung... (${retryCount}/5)` : 'Neuverbindung...'}
                                </span>
                            ) : (
                                <span className="font-semibold text-primary">
                                    <FontAwesomeIcon className="mr-1" icon={faWireless} /> Sprachchat verbunden
                                </span>
                            )}
                            <span className="text-xs text-foreground">{callLabel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {krisp && (
                                <button onClick={toggleKrisp} className="cursor-pointer rounded-lg text-xl text-red-400 hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                                    {krisp.isNoiseFilterEnabled ? <FontAwesomeIcon className="text-primary" icon={faWaveform} /> : <FontAwesomeIcon icon={faWaveform} />}
                                </button>
                            )}
                            <button onClick={leaveVoice} className="cursor-pointer rounded-lg text-xl text-red-400 hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                                <FontAwesomeIcon icon={faPhoneSlash} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pl-1 pr-2 py-1">
                <HasUserPopup classes="w-full" isProfilePopup={true} user={user} orientation="top">
                    <div className="flex items-center gap-3 hover:bg-card px-2 grow py-1 rounded-lg cursor-pointer">
                        <UserAvatar icon={user.username.charAt(0).toUpperCase()} avatar={user.avatar} online={online} status={status} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-foreground text-base font-medium truncate">
                                {user.displayName ?? user.username}
                            </span>
                            <span className="text-muted-foreground text-xs">
                                <StatusText hideBubble={true} hideDescription={true} online={online} userStatus={status} showRealStatus={true} />
                            </span>
                        </div>
                    </div>
                </HasUserPopup>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleMute}
                        disabled={isAfk}
                        title={isAfk ? 'Im AFK-Kanal gesperrt' : undefined}
                        className={`rounded-lg ${muted ? 'text-red-400' : 'text-foreground'} text-xl px-1.5 py-1.5 ${isAfk ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-card/80 hover:text-foreground'}`}
                    >
                        <FontAwesomeIcon icon={muted ? faMicrophoneSlash : faMicrophone} />
                    </button>
                    <button onClick={toggleDeafen} className={`cursor-pointer rounded-lg ${deafened ? 'text-red-400' : 'text-foreground/80'} text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5`}>
                        <FontAwesomeIcon icon={deafened ? faHeadphonesSlash : faHeadset} />
                    </button>
                    <button onClick={() => openSettings('profile')} className="cursor-pointer rounded-lg  text-foreground/80 text-xl hover:bg-card/80 hover:text-foreground px-1.5 py-1.5">
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UserPanel;