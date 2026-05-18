import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faVolumeHigh, faChevronDown } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useVoice } from "../../../hooks/useVoice.jsx";
import {
    getMicDeviceId, setMicDeviceId,
    getSpeakerDeviceId, setSpeakerDeviceId,
    getMicGain, setMicGain as persistMicGain,
    getMicThreshold, setMicThreshold as persistMicThreshold,
    DEFAULT_DEVICE, MIN_MIC_GAIN, MAX_MIC_GAIN,
    MIN_MIC_THRESHOLD, MAX_MIC_THRESHOLD,
} from "../../../services/voiceSettings.js";
import MicLevelMeter from "../components/MicLevelMeter.jsx";

function DeviceSelect({ icon, label, devices, value, onChange, placeholder }) {
    return (
        <label className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FontAwesomeIcon icon={icon} className="w-3.5 text-muted-foreground" />
                {label}
            </div>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-9 text-sm text-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                    <option value={DEFAULT_DEVICE}>Systemstandard</option>
                    {devices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>
                            {d.label || placeholder}
                        </option>
                    ))}
                </select>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs"
                />
            </div>
        </label>
    );
}

function VoiceSection() {
    const { setMicDevice, setSpeakerDevice, setMicGain, setMicThreshold, isConnected } = useVoice() ?? {};

    const [inputs, setInputs] = useState([]);
    const [outputs, setOutputs] = useState([]);
    const [micId, setMicIdState] = useState(getMicDeviceId);
    const [speakerId, setSpeakerIdState] = useState(getSpeakerDeviceId);
    const [gain, setGainState] = useState(getMicGain);
    const [threshold, setThresholdState] = useState(getMicThreshold);
    const [permError, setPermError] = useState(null);

    async function refreshDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setInputs(devices.filter(d => d.kind === 'audioinput' && d.deviceId !== DEFAULT_DEVICE));
            setOutputs(devices.filter(d => d.kind === 'audiooutput' && d.deviceId !== DEFAULT_DEVICE));
        } catch (err) {
            setPermError(err?.message || 'Geräteliste konnte nicht geladen werden.');
        }
    }

    useEffect(() => {
        refreshDevices();
        const handler = () => refreshDevices();
        navigator.mediaDevices?.addEventListener?.('devicechange', handler);
        return () => navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
    }, []);

    async function requestMicPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            setPermError(null);
            await refreshDevices();
        } catch (err) {
            setPermError(err?.message || 'Mikrofonzugriff verweigert.');
        }
    }

    function handleMicChange(id) {
        setMicIdState(id);
        if (setMicDevice) setMicDevice(id);
        else setMicDeviceId(id);
    }

    function handleSpeakerChange(id) {
        setSpeakerIdState(id);
        if (setSpeakerDevice) setSpeakerDevice(id);
        else setSpeakerDeviceId(id);
    }

    function handleGainChange(e) {
        const v = Number(e.target.value);
        setGainState(v);
        if (setMicGain) setMicGain(v);
        else persistMicGain(v);
    }

    function handleThresholdChange(e) {
        const v = Number(e.target.value);
        setThresholdState(v);
        if (setMicThreshold) setMicThreshold(v);
        else persistMicThreshold(v);
    }

    const labelsMissing = inputs.length > 0 && inputs.every(d => !d.label);

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Sprache & Video</h1>
            </div>

            <div className="max-w-[70%] py-4 px-4 w-full mx-auto flex flex-col gap-8 overflow-y-auto">
                {labelsMissing && (
                    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                            Gerätenamen sind erst nach Mikrofonfreigabe sichtbar.
                        </p>
                        <button
                            onClick={requestMicPermission}
                            className="self-start px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors cursor-pointer"
                        >
                            Mikrofon freigeben
                        </button>
                    </div>
                )}

                {permError && (
                    <div className="bg-red-500/10 border border-red-400/40 rounded-lg p-3 text-sm text-red-300">
                        {permError}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 items-start">
                    <div className="flex flex-col gap-3">
                        <DeviceSelect
                            icon={faMicrophone}
                            label="Eingabegerät"
                            devices={inputs}
                            value={micId}
                            onChange={handleMicChange}
                            placeholder="Mikrofon"
                        />

                        <div className="flex flex-col gap-3 bg-card border border-border rounded-lg p-3">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-foreground">Pegel</span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {threshold > 0 ? `Aktiv ab ${Math.round((threshold / MAX_MIC_THRESHOLD) * 100)}%` : 'Immer aktiv'}
                                    </span>
                                </div>
                                <MicLevelMeter
                                    deviceId={micId}
                                    gain={gain}
                                    threshold={threshold}
                                    active={!labelsMissing || inputs.length > 0}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-foreground">Aktivierungspegel</span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {threshold > 0 ? `${Math.round((threshold / MAX_MIC_THRESHOLD) * 100)}%` : 'Aus'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={MIN_MIC_THRESHOLD}
                                    max={MAX_MIC_THRESHOLD}
                                    step="0.005"
                                    value={threshold}
                                    onChange={handleThresholdChange}
                                    className="w-full accent-primary cursor-pointer"
                                    aria-label="Aktivierungspegel"
                                />
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                    Erst ab diesem Pegel wird dein Mikro gesendet. Auf 0 = immer offen.
                                </p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-foreground">Eingabelautstärke</span>
                                    <span className="text-muted-foreground tabular-nums">{Math.round(gain * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={MIN_MIC_GAIN}
                                    max={MAX_MIC_GAIN}
                                    step="0.05"
                                    value={gain}
                                    onChange={handleGainChange}
                                    className="w-full accent-primary cursor-pointer"
                                    aria-label="Eingabelautstärke"
                                />
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                    Verstärkt dein Mikro bevor es gesendet wird. Über 100 % kann clippen.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DeviceSelect
                        icon={faVolumeHigh}
                        label="Ausgabegerät"
                        devices={outputs}
                        value={speakerId}
                        onChange={handleSpeakerChange}
                        placeholder="Lautsprecher"
                    />
                </div>

                {!isConnected && (
                    <p className="text-xs text-muted-foreground">
                        Geräteänderungen werden beim nächsten Voice-Beitritt aktiv.
                    </p>
                )}
            </div>
        </div>
    );
}

export default VoiceSection;