function ContentHeader({children}) {

    return(
        <div className="flex shrink-0 items-center justify-between h-12 px-4 border-b-2 border-border gap-3">
            {children}
        </div>
    )
}
export default ContentHeader;