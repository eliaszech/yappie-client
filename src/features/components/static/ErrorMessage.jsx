function ErrorMessage({ title = 'Fehler beim Laden', message = "Daten konnten nicht geladen werden", icon, onRetry }) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 gap-1">
            {icon && (
                <span className="text-muted-foreground text-6xl">{icon}</span>
            )}
            <span className="text-foreground text-xl font-bold">{title}</span>
            <span className="text-muted-foreground text-lg">{message}</span>
            {onRetry && (
                <button onClick={onRetry} className="bg-primary text-primary-foreground rounded-md px-2 py-1">
                    Erneut versuchen
                </button>
            )}
        </div>
    );
}
export default ErrorMessage;