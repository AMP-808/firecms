import {
    ArrayProperty,
    BooleanProperty,
    CMSType,
    DateProperty,
    EnumValueConfig,
    GeopointProperty,
    MapProperty,
    NumberProperty,
    ReferenceProperty,
    StringProperty
} from "./properties";
import { EntityReference, GeoPoint } from "./entities";
import { EntityCollection } from "./collections";

/**
 * This is the same entity collection you define, only all the property builders
 * are resolved to regular `Property` objects.
 * @category Models
 */
export type ResolvedEntityCollection<M extends { [Key: string]: any } = any> =
    Omit<EntityCollection<M>, "properties"> &
    {
        properties: ResolvedProperties<M>,
        originalCollection: EntityCollection<M>,
        editable?: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedProperty<T extends CMSType = CMSType> =
    T extends string ? ResolvedStringProperty :
        T extends number ? ResolvedNumberProperty :
            T extends boolean ? ResolvedBooleanProperty :
                T extends Date ? ResolvedTimestampProperty :
                    T extends GeoPoint ? ResolvedGeopointProperty :
                        T extends EntityReference ? ResolvedReferenceProperty :
                            T extends Array<CMSType> ? ResolvedArrayProperty<T> :
                                T extends { [Key: string]: any } ? ResolvedMapProperty<T> : never;

/**
 * @category Entity properties
 */
export type ResolvedProperties<M extends { [Key: string]: any } = any> = {
    [k in keyof M]: ResolvedProperty<M[keyof M]>;
};

/**
 * @category Entity properties
 */
export type ResolvedStringProperty =
    Omit<StringProperty, "enumValues" | "dataType"> &
    {
        dataType: "string";
        resolved: true;
        enumValues?: EnumValueConfig[];
        fromBuilder: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedNumberProperty =
    Omit<NumberProperty, "enumValues" | "dataType"> &
    {
        dataType: "number";
        resolved: true;
        enumValues?: EnumValueConfig[];
        fromBuilder: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedBooleanProperty =
    Omit<BooleanProperty, "dataType"> &
    {
        dataType: "boolean";
        resolved: true;
        fromBuilder: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedTimestampProperty =
    Omit<DateProperty, "dataType"> &
    {
        dataType: "date";
        resolved: true;
        fromBuilder: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedGeopointProperty =
    Omit<GeopointProperty, "dataType"> &
    {
        dataType: "geopoint";
        resolved: true;
        fromBuilder: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedReferenceProperty =
    Omit<ReferenceProperty, "dataType"> &
    {
        dataType: "reference";
        resolved: true;
        fromBuilder: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedArrayProperty<T extends ArrayT[] = any[], ArrayT extends CMSType = any> =
    Omit<ArrayProperty, "of" | "oneOf" | "dataType"> &
    {
        dataType: "array";
        resolved: true;
        of?: ResolvedProperty<ArrayT> | ResolvedProperty[],
        oneOf?: {
            properties: Record<string, ResolvedProperty>
            typeField?: string;
            valueField?: string;
        },
        resolvedProperties: ResolvedProperty[];
        fromBuilder: boolean;
    }

/**
 * @category Entity properties
 */
export type ResolvedMapProperty<T extends { [Key: string]: any } = any> =
    Omit<MapProperty, "properties" | "dataType" | "propertiesOrder"> &
    {
        dataType: "map";
        resolved: true;
        properties?: ResolvedProperties<Partial<T>>;
        propertiesOrder?: string[];
        fromBuilder: boolean;
    }
