function ContentHeader({children}) {

    return(
        <div className="flex shrink-0 items-center justify-between bg-guild-bar h-12 px-4 border-b-2 border-border gap-3">
            {children}
        </div>
    )
}
export default ContentHeader;