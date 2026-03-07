
function AddFriend() {
    return (
        <div>
            <div className="p-4 border-b border-border"><h3
                className="text-[15px] font-bold text-foreground uppercase mb-1">Add Friend</h3><p
                className="text-[13px] text-muted-foreground mb-4">You can add friends with their username.</p>
                <div
                    className="flex items-center gap-2 p-1.5 rounded-md border border-border bg-input focus-within:ring-2 focus-within:ring-primary/80 transition-colors">
                    <input type="text"
                        className="flex-1 bg-transparent px-3 py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                        placeholder="You can add friends with their username. e.g. CoolUser#1234"
                        />
                    <button disabled=""
                            className="px-5 py-2 rounded bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-40 hover:bg-primary/80 transition-all flex-shrink-0">Send
                        Friend Request
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddFriend;