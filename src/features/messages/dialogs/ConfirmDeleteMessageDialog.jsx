import MessageItem from "../components/MessageItem.jsx";

function ConfirmDeleteMessageDialog({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
            <div className="relative bg-background rounded-lg border border-border shadow-xl w-125 p-6">
                <h3 className="text-lg font-semibold text-foreground">Nachricht löschen</h3>
                <p className="text-sm text-muted-foreground mt-2">Bist du sicher das du diese Nachricht löschen möchtest?
                    Diese Aktion kann nicht rückgängig gemacht werden</p>
                <div className="my-4 rounded-lg bg-guild-bar" >
                    <MessageItem message={message} disabled />
                </div>
                <p className="text-sm text-muted-foreground mb-2"><b className="text-green-300">Tipp:</b> Halte die Shift Taste gedrückt während du auf <b>Nachricht löschen</b> klickst um die Nachricht sofort zu löschen</p>
                <div className="flex justify-evenly gap-2 mt-6">
                    <button onClick={onCancel}
                        className="cursor-pointer w-full bg-card px-4 py-2 text-sm rounded-md text-foreground hover:bg-muted">
                        Abbrechen
                    </button>
                    <button onClick={onConfirm}
                        className={`cursor-pointer w-full px-4 py-2 text-sm rounded-md font-medium text-white bg-red-500 hover:bg-red-400`}>
                        Löschen
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDeleteMessageDialog;
