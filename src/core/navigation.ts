import { EntityCollection, EntityCustomView, Navigation } from "../models";

const DATA_PATH = `/c`;

export function isCollectionPath(path: string) {
    return path.startsWith(`${DATA_PATH}/`);
}

export function getEntityOrCollectionPath(path: string) {
    if (path.startsWith(`${DATA_PATH}/`))
        return path.replace(`${DATA_PATH}/`, "");
    throw Error("Expected path starting with " + DATA_PATH);
}

export function getEntityPath(entityId: string,
                              basePath: string,
                              subcollection?: string) {
    return `${DATA_PATH}/${removeInitialAndTrailingSlashes(basePath)}/${entityId}${subcollection ? "/" + subcollection : ""}`;
}

export function buildCollectionUrl(path: string) {
    return `${DATA_PATH}/${removeInitialAndTrailingSlashes(path)}`;
}

export function buildNewEntityUrl(basePath: string) {
    return `${DATA_PATH}/${removeInitialAndTrailingSlashes(basePath)}#new`;
}

export function removeInitialAndTrailingSlashes(s: string) {
    return removeInitialSlash(removeTrailingSlash(s));
}

export function removeInitialSlash(s: string) {
    if (s.startsWith("/"))
        return s.slice(1);
    else return s;
}

export function removeTrailingSlash(s: string) {
    if (s.endsWith("/"))
        return s.slice(0, -1);
    else return s;
}


export function addInitialSlash(s: string) {
    if (s.startsWith("/"))
        return s;
    else return `/${s}`;
}


/**
 * Find the corresponding view at any depth for a given path.
 * @param path
 * @param collectionViews
 */
export function getCollectionViewFromPath(path: string, collectionViews?: EntityCollection[]): EntityCollection | undefined {

    if (!collectionViews)
        return undefined;

    const subpaths = removeInitialAndTrailingSlashes(path).split("/");
    if (subpaths.length % 2 === 0) {
        throw Error(`Collection paths must have an odd number of segments: ${path}`);
    }

    return getCollectionViewFromPathInternal(removeInitialAndTrailingSlashes(path), collectionViews);

}

function getCollectionViewFromPathInternal<M extends { [Key: string]: any }>(path: string, collectionViews: EntityCollection[]): EntityCollection | undefined {

    const subpaths = removeInitialAndTrailingSlashes(path).split("/");
    const subpathCombinations = getCollectionPathsCombinations(subpaths);

    let result: EntityCollection | undefined = undefined;
    for (let i = 0; i < subpathCombinations.length; i++) {
        const subpathCombination = subpathCombinations[i];
        const navigationEntry = collectionViews && collectionViews.find((entry) => entry.relativePath === subpathCombination);

        if (navigationEntry) {

            if (subpathCombination === path) {
                result = navigationEntry;
            } else if (navigationEntry.subcollections) {
                const newPath = path.replace(subpathCombination, "").split("/").slice(2).join("/");
                if (newPath.length > 0)
                    result = getCollectionViewFromPathInternal(newPath, navigationEntry.subcollections);
            }
        }
        if (result) break;
    }
    return result;
}

/**
 * Get the subcollection combinations from a path:
 * "sites/es/locales" => ["sites/es/locales", "sites"]
 * @param subpaths
 */
function getCollectionPathsCombinations(subpaths: string[]): string[] {
    const entries = subpaths.length > 0 && subpaths.length % 2 == 0 ? subpaths.splice(0, subpaths.length - 1) : subpaths;

    const length = entries.length;
    const result: string[] = [];
    for (let i = length; i > 0; i = i - 2) {
        result.push(entries.slice(0, i).join("/"));
    }
    return result;

}

export type NavigationViewEntry<M> =
    | NavigationViewEntity<M>
    | NavigationViewCollection<M>
    | NavigationViewCustom<M>;

interface NavigationViewEntity<M> {
    type: "entity";
    entityId: string;
    relativePath: string;
    path: string;
    parentCollection: EntityCollection<M>;
}

interface NavigationViewCollection<M> {
    type: "collection";
    path: string;
    collection: EntityCollection<M>;
}

interface NavigationViewCustom<M> {
    type: "custom_view";
    path: string;
    view: EntityCustomView<M>;
}

export function getNavigationEntriesFromPathInternal<M extends { [Key: string]: any }>(props: {
    path: string,
    allCollections: EntityCollection[],
    customViews?: EntityCustomView<M>[],
    currentFullPath?: string
}): NavigationViewEntry<M> [] {

    const {
        path,
        allCollections,
        currentFullPath
    } = props;

    const subpaths = removeInitialAndTrailingSlashes(path).split("/");
    const subpathCombinations = getCollectionPathsCombinations(subpaths);

    let result: NavigationViewEntry<M> [] = [];
    for (let i = 0; i < subpathCombinations.length; i++) {
        const subpathCombination = subpathCombinations[i];

        const collection = allCollections && allCollections.find((entry) => entry.relativePath === subpathCombination);
        if (collection) {
            const path = currentFullPath && currentFullPath.length > 0
                ? (currentFullPath + "/" + collection.relativePath)
                : collection.relativePath;

            result.push({
                type: "collection",
                path,
                collection
            });
            const restOfThePath = removeInitialAndTrailingSlashes(path.replace(subpathCombination, ""));
            const nextSegments = restOfThePath.length > 0 ? restOfThePath.split("/") : [];
            if (nextSegments.length > 0) {
                const entityId = nextSegments[0];
                const fullPath = path + "/" + entityId;
                result.push({
                    type: "entity",
                    entityId: entityId,
                    relativePath: path,
                    path: fullPath,
                    parentCollection: collection
                });
                if (nextSegments.length > 1) {
                    const newPath = nextSegments.slice(1).join("/");
                    const customViews = collection.schema.views;
                    const customView = customViews && customViews.find((entry) => entry.path === newPath);
                    if (customView) {
                        const path = currentFullPath && currentFullPath.length > 0
                            ? (currentFullPath + "/" + customView.path)
                            : customView.path;
                        result.push({
                            type: "custom_view",
                            path,
                            view: customView
                        });
                    } else if (collection.subcollections) {
                        result.push(...getNavigationEntriesFromPathInternal({
                            path: newPath,
                            customViews: customViews,
                            allCollections: collection.subcollections,
                            currentFullPath: fullPath
                        }));
                    }
                }
            }
            break;
        }

    }
    return result;
}

export interface TopNavigationEntry {
    url: string;
    name: string;
    description?: string;
    group?: string;
}

export function computeTopNavigation(navigation:Navigation, includeHiddenViews: boolean): {
    navigationEntries: TopNavigationEntry[],
    groups: string[]
} {
    const navigationEntries: TopNavigationEntry[] = [
        ...navigation.collections.map(collection => ({
            url: buildCollectionUrl(collection.relativePath),
            name: collection.name,
            description: collection.description,
            group: collection.group
        })),
        ...(navigation.views ?? []).map(view =>
            includeHiddenViews || !view.hideFromNavigation ?
                ({
                    url: addInitialSlash(Array.isArray(view.path) ? view.path[0] : view.path),
                    name: view.name,
                    description: view.description,
                    group: view.group
                })
                : undefined)
            .filter((view) => !!view) as TopNavigationEntry[]
    ];

    const groups: string[] = Array.from(new Set(
        Object.values(navigationEntries).map(e => e.group).filter(Boolean) as string[]
    ).values());

    return { navigationEntries, groups };
}
