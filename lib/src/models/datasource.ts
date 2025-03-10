import { Entity, EntityStatus, EntityValues } from "./entities";
import { EntityCollection, FilterValues } from "./collections";
import {
    ResolvedEntityCollection,
    ResolvedProperty
} from "./resolved_entities";

/**
 * @category Datasource
 */
export interface FetchEntityProps<M> {
    path: string;
    entityId: string;
    collection: EntityCollection<M>
}

/**
 * @category Datasource
 */
export type ListenEntityProps<M> = FetchEntityProps<M> & {
    onUpdate: (entity: Entity<M>) => void,
    onError?: (error: Error) => void,
}

/**
 * @category Datasource
 */
export interface FetchCollectionProps<M> {
    path: string;
    collection: EntityCollection<M> | ResolvedEntityCollection<M>;
    filter?: FilterValues<Extract<keyof M, string>>,
    limit?: number;
    startAfter?: any[];
    orderBy?: string;
    searchString?: string;
    order?: "desc" | "asc";
}

/**
 * @category Datasource
 */
export type ListenCollectionProps<M> =
    FetchCollectionProps<M> &
    {
        onUpdate: (entities: Entity<M>[]) => void;
        onError?: (error: Error) => void;
    };

/**
 * @category Datasource
 */
export interface SaveEntityProps<M> {
    path: string;
    values: Partial<EntityValues<M>>;
    entityId?: string; // can be empty for new entities
    previousValues?: Partial<EntityValues<M>>;
    collection: EntityCollection<M> | ResolvedEntityCollection<M>;
    status: EntityStatus;
}

/**
 * @category Datasource
 */
export interface DeleteEntityProps<M> {
    entity: Entity<M>;
}

/**
 * Implement this interface and pass it to a {@link FireCMS}
 * to connect it to your data source.
 * A Firestore implementation of this interface can be found in {@link useFirestoreDataSource}
 * @category Datasource
 */
export interface DataSource {

    /**
     * Fetch data from a collection
     * @param path
     * @param collection
     * @param filter
     * @param limit
     * @param startAfter
     * @param orderBy
     * @param order
     * @param searchString
     * @return Function to cancel subscription
     * @see useCollectionFetch if you need this functionality implemented as a hook
     */
    fetchCollection<M>({
                           path,
                           collection,
                           filter,
                           limit,
                           startAfter,
                           orderBy,
                           order,
                           searchString
                       }: FetchCollectionProps<M>
    ): Promise<Entity<M>[]>;

    /**
     * Listen to a entities in a given path. If you don't implement this method
     * `fetchCollection` will be used instead, with no real time updates.
     * @param path
     * @param collection
     * @param onUpdate
     * @param onError
     * @param filter
     * @param limit
     * @param startAfter
     * @param orderBy
     * @param order
     * @param searchString
     * @return Function to cancel subscription
     * @see useCollectionFetch if you need this functionality implemented as a hook
     */
    listenCollection?<M>(
        {
            path,
            collection,
            filter,
            limit,
            startAfter,
            searchString,
            orderBy,
            order,
            onUpdate,
            onError
        }: ListenCollectionProps<M>
    ): () => void;

    /**
     * Retrieve an entity given a path and a collection
     * @param path
     * @param entityId
     * @param collection
     */
    fetchEntity<M>({
                       path,
                       entityId,
                       collection
                   }: FetchEntityProps<M>
    ): Promise<Entity<M> | undefined>;

    /**
     * Get realtime updates on one entity.
     * @param path
     * @param entityId
     * @param collection
     * @param onUpdate
     * @param onError
     * @return Function to cancel subscription
     */
    listenEntity?<M>({
                         path,
                         entityId,
                         collection,
                         onUpdate,
                         onError
                     }: ListenEntityProps<M>): () => void;

    /**
     * Save entity to the specified path
     * @param path
     * @param id
     * @param collection
     * @param status
     */
    saveEntity<M>(
        {
            path,
            entityId,
            values,
            collection,
            status
        }: SaveEntityProps<M>): Promise<Entity<M>>;

    /**
     * Delete an entity
     * @param entity
     * @return was the whole deletion flow successful
     */
    deleteEntity<M>(
        {
            entity
        }: DeleteEntityProps<M>
    ): Promise<void>;

    /**
     * Check if the given property is unique in the given collection
     * @param path Collection path
     * @param name of the property
     * @param value
     * @param property
     * @param entityId
     * @return `true` if there are no other fields besides the given entity
     */
    checkUniqueField(
        path: string,
        name: string,
        value: any,
        property: ResolvedProperty,
        entityId?: string
    ): Promise<boolean>;

    /**
     * Generate an id for a new entity
     */
    generateEntityId(path: string): string;
}
