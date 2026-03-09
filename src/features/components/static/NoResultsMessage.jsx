function ErrorMessage({ title = 'Keine Einträge', message = "Es konnten keine Einträge gefunden", icon }) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 gap-1">
            {icon && (
                <span className="text-muted-foreground text-6xl">{icon}</span>
            )}
            <span className="text-foreground text-xl font-bold">{title}</span>
            <span className="text-muted-foreground text-center text-lg">{message}</span>
        </div>
    );
}
export default ErrorMessage;