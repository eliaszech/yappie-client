const lastPaths = {};

export function useLastPath(key, defaultPath) {
    function savePath(path) {
        lastPaths[key] = path;
    }

    function getPath() {
        return lastPaths[key] || defaultPath;
    }

    return { savePath, getPath };
}