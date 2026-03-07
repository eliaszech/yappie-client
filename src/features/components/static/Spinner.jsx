function Spinner({ size = 'w-8 h-8'}) {
    return <div className="flex h-full items-center justify-center p-8">
        <div className={`${size} border-4 border-muted border-t-primary rounded-full animate-spin`}></div>
    </div>
}
export default Spinner;