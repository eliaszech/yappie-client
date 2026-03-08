function Input({type = 'text', placeholder = '', value, setValue}) {
    return (
        <input type={type} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
               className="w-full h-11 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
               value={value} />
    )
}

export default Input;