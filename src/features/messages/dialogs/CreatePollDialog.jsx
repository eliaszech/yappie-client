import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark, faSpinner } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { createPoll } from "../../../services/api.js";

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;

export default function CreatePollDialog({ type, roomId, initialQuestion = '', onClose }) {
    const [question, setQuestion] = useState(initialQuestion);
    const [options, setOptions] = useState(['', '']);
    const [multipleChoice, setMultipleChoice] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = question.trim().length > 0 && options.filter(o => o.trim().length > 0).length >= MIN_OPTIONS;

    function updateOption(index, value) {
        setOptions(prev => prev.map((o, i) => i === index ? value : o));
    }

    function addOption() {
        if (options.length >= MAX_OPTIONS) return;
        setOptions(prev => [...prev, '']);
    }

    function removeOption(index) {
        if (options.length <= MIN_OPTIONS) return;
        setOptions(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit() {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setError('');

        const payload = {
            question: question.trim(),
            options: options.map(o => o.trim()).filter(o => o.length > 0),
            multipleChoice,
            ...(type === 'channel' ? { channelId: roomId } : { conversationId: roomId }),
        };

        const res = await createPoll(payload);
        setSubmitting(false);

        if (res?.error) {
            setError(res.error);
            return;
        }
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-background rounded-lg border border-border shadow-xl w-[480px] max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Umfrage erstellen</h3>
                </div>

                <div className="px-6 py-4 flex flex-col gap-4 overflow-y-auto">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Frage
                        </label>
                        <input
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            maxLength={300}
                            placeholder="Worüber soll abgestimmt werden?"
                            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Antworten ({options.length}/{MAX_OPTIONS})
                        </label>
                        <div className="flex flex-col gap-2">
                            {options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        value={opt}
                                        onChange={e => updateOption(i, e.target.value)}
                                        maxLength={100}
                                        placeholder={`Option ${i + 1}`}
                                        className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                    />
                                    <button
                                        onClick={() => removeOption(i)}
                                        disabled={options.length <= MIN_OPTIONS}
                                        title="Entfernen"
                                        className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {options.length < MAX_OPTIONS && (
                            <button
                                onClick={addOption}
                                className="self-start mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Option hinzufügen
                            </button>
                        )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={multipleChoice}
                            onChange={e => setMultipleChoice(e.target.checked)}
                            className="accent-primary"
                        />
                        <span className="text-sm text-foreground">Mehrfachauswahl erlauben</span>
                    </label>

                    {error && <p className="text-sm text-dnd">{error}</p>}
                </div>

                <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md text-foreground hover:bg-muted/50 cursor-pointer"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className="px-4 py-2 text-sm rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Umfrage starten'}
                    </button>
                </div>
            </div>
        </div>
    );
}
