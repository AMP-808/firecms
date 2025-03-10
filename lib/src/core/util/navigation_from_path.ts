import { EntityCollection, EntityCustomView } from "../../models";
import {
    getCollectionPathsCombinations,
    removeInitialAndTrailingSlashes
} from "./navigation_utils";

export type NavigationViewInternal<M> =
    | NavigationViewEntityInternal<M>
    | NavigationViewCollectionInternal<M>
    | NavigationViewEntityCustomInternal<M>;

interface NavigationViewEntityInternal<M> {
    type: "entity";
    entityId: string;
    path: string;
    parentCollection: EntityCollection<M>;
}

interface NavigationViewCollectionInternal<M> {
    type: "collection";
    path: string;
    collection: EntityCollection<M>;
}

interface NavigationViewEntityCustomInternal<M> {
    type: "custom_view";
    path: string;
    view: EntityCustomView<M>;
}

export function getNavigationEntriesFromPathInternal<M extends { [Key: string]: any }>(props: {
    path: string,
    collections: EntityCollection[] | undefined,
    customViews?: EntityCustomView<M>[],
    currentFullPath?: string,
}): NavigationViewInternal<M> [] {

    const {
        path,
        collections = [],
        currentFullPath
    } = props;

    const subpaths = removeInitialAndTrailingSlashes(path).split("/");
    const subpathCombinations = getCollectionPathsCombinations(subpaths);

    const result: NavigationViewInternal<M> [] = [];
    for (let i = 0; i < subpathCombinations.length; i++) {
        const subpathCombination = subpathCombinations[i];

        const collection = collections && collections.find((entry) => entry.alias === subpathCombination || entry.path === subpathCombination);

        if (collection) {
            const pathOrAlias = collection.alias ?? collection.path;
            const collectionPath = currentFullPath && currentFullPath.length > 0
                ? (currentFullPath + "/" + pathOrAlias)
                : pathOrAlias;

            result.push({
                type: "collection",
                path: collectionPath,
                collection
            });
            const restOfThePath = removeInitialAndTrailingSlashes(removeInitialAndTrailingSlashes(path).replace(subpathCombination, ""));
            const nextSegments = restOfThePath.length > 0 ? restOfThePath.split("/") : [];
            if (nextSegments.length > 0) {
                const entityId = nextSegments[0];
                const fullPath = collectionPath + "/" + entityId;
                result.push({
                    type: "entity",
                    entityId,
                    path: collectionPath,
                    parentCollection: collection
                });
                if (nextSegments.length > 1) {
                    const newPath = nextSegments.slice(1).join("/");
                    if (!collection) {
                        throw Error("collection not found resolving path: " + collection);
                    }
                    const customViews = collection.views;
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
                            customViews,
                            collections: collection.subcollections,
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
