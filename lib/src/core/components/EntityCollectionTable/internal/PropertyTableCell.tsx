import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import equal from "react-fast-compare"
import {
    CMSType,
    Entity,
    EntityCollection,
    EntityReference,
    ResolvedArrayProperty,
    ResolvedNumberProperty,
    ResolvedProperty,
    ResolvedStringProperty
} from "../../../../models";
import { TableInput } from "../../Table/fields/TableInput";
import { TableSelect } from "../../Table/fields/TableSelect";
import { NumberTableInput } from "../../Table/fields/TableNumberInput";
import { TableSwitch } from "../../Table/fields/TableSwitch";
import { TableDateField } from "../../Table/fields/TableDateField";
import { ErrorBoundary } from "../../ErrorBoundary";
import { PropertyPreview } from "../../../../preview";
import { TableReferenceField } from "../fields/TableReferenceField";

import { getPreviewSizeFrom } from "../../../../preview/util";
import { isReadOnly } from "../../../util";
import { TableCell } from "../../Table/TableCell";
import { TableStorageUpload } from "../fields/TableStorageUpload";
import {
    CustomFieldValidator,
    mapPropertyToYup
} from "../../../../form/validation";
import { useEntityCollectionTableController } from "../EntityCollectionTable";
import { useClearRestoreValue } from "../../../../hooks";

export interface PropertyTableCellProps<T extends CMSType, M> {
    propertyKey: string;
    columnIndex: number;
    align: "right" | "left" | "center";
    customFieldValidator?: CustomFieldValidator;
    value: T;
    collection: EntityCollection<M>;
    setFocused: (value: boolean) => void;
    property: ResolvedProperty<T>;
    height: number;
    width: number;
    entity: Entity<any>;
    path: string;
}

/**
 * Props passed in a callback when the content of a cell in a table has been edited
 */
export interface OnCellChangeParams<T, M> {
    value: T,
    propertyKey: string,
    entity: Entity<M>;
    setError: (e: Error) => void,
    setSaved: (saved: boolean) => void
}

function isStorageProperty<T>(property: ResolvedProperty) {
    if (property.dataType === "string" && (property as ResolvedStringProperty).storage)
        return true;
    if (property.dataType === "array") {
        if (Array.isArray(property.of)) {
            return false;
        } else {
            return ((property as ResolvedArrayProperty).of as ResolvedProperty)?.dataType === "string" &&
                ((property as ResolvedArrayProperty).of as ResolvedStringProperty)?.storage
        }
    }
    return false;
}

export const PropertyTableCell = React.memo<PropertyTableCellProps<any, any>>(
    function PropertyTableCell<T extends CMSType, M>({
                                                         propertyKey,
                                                         setFocused,
                                                         columnIndex,
                                                         customFieldValidator,
                                                         value,
                                                         property,
                                                         align,
                                                         width,
                                                         height,
                                                         collection,
                                                         path,
                                                         entity
                                                     }: PropertyTableCellProps<T, M>) {

        const {
            onValueChange,
            size,
            selectedCell,
            focused,
            select,
            setPopupCell
        } = useEntityCollectionTableController();

        const selected = selectedCell?.columnIndex === columnIndex &&
            selectedCell?.entity.id === entity.id;

        const [internalValue, setInternalValue] = useState<any | null>(value);
        const internalValueRef = useRef(value);

        const [error, setError] = useState<Error | undefined>();
        const [saved, setSaved] = useState<boolean>(false);

        const customField = Boolean(property.Field);
        const customPreview = Boolean(property.Preview);
        const readOnly = isReadOnly(property);
        const disabledTooltip: string | undefined = typeof property.disabled === "object" ? property.disabled.disabledMessage : undefined;
        const disabled = Boolean(property.disabled);

        const validation = useMemo(() => mapPropertyToYup({
            property,
            entityId: entity.id,
            customFieldValidator,
            name: propertyKey
        }), [entity.id, property, propertyKey]);

        const onBlur = useCallback(() => {
            setFocused(false);
        }, []);

        useEffect(
            () => {
                if (!equal(value, internalValueRef.current)) {
                    setInternalValue(value);
                    internalValueRef.current = value;
                }
            },
            [value]
        );

        const saveValues = useCallback((value: any) => {
            setSaved(false);
            validation
                .validate(value)
                .then(() => {
                    setError(undefined);
                    if (onValueChange) {
                        onValueChange({
                            value,
                            propertyKey,
                            setError,
                            setSaved,
                            entity
                        });
                    }
                })
                .catch((e) => {
                    setError(e);
                });
        }, [entity, onValueChange, propertyKey, validation]);

        useEffect(() => {
            validation
                .validate(internalValue)
                .catch((e) => {
                    setError(e);
                });
        }, [internalValue, validation]);

        const updateValue = useCallback(
            (newValue: any | null) => {

                let updatedValue: any;
                if (newValue === undefined) {
                    updatedValue = null;
                } else {
                    updatedValue = newValue;
                }
                internalValueRef.current = updatedValue;
                setInternalValue(updatedValue);
                saveValues(updatedValue);
            },
            [saveValues]
        );

        useClearRestoreValue<any>({
            property,
            value: internalValue,
            setValue: updateValue
        });

        const onSelect = useCallback((cellRect: DOMRect | undefined) => {
            if (!cellRect) {
                select(undefined);
            } else {
                select({
                    columnIndex,
                    width,
                    height,
                    entity,
                    cellRect,
                    propertyKey: propertyKey as keyof M,
                    collection
                });
            }
        }, [collection, columnIndex, entity, height, propertyKey, select, width]);

        const openPopup = useCallback((cellRect: DOMRect | undefined) => {
            if (!cellRect) {
                setPopupCell(undefined);
            } else {
                setPopupCell({
                    columnIndex,
                    width,
                    height,
                    entity,
                    cellRect,
                    propertyKey: propertyKey as keyof M,
                    collection
                });
            }
        }, [collection, columnIndex, entity, height, propertyKey, width]);

        let innerComponent: JSX.Element | undefined;
        let allowScroll = false;
        let showExpandIcon = false;
        let removePadding = false;
        let fullHeight = false;

        if (!readOnly && !customField && (!customPreview || selected)) {
            const isAStorageProperty = isStorageProperty(property);
            if (isAStorageProperty) {
                innerComponent = <TableStorageUpload error={error}
                                                     disabled={disabled}
                                                     focused={focused}
                                                     property={property as ResolvedStringProperty | ResolvedArrayProperty<string[]>}
                                                     entity={entity}
                                                     path={path}
                                                     value={internalValue}
                                                     previewSize={getPreviewSizeFrom(size)}
                                                     updateValue={updateValue}
                                                     propertyKey={propertyKey as string}
                                                     onBlur={onBlur}
                />;
                showExpandIcon = true;
                fullHeight = true;
                removePadding = true;
            } else if (selected && property.dataType === "number") {
                const numberProperty = property as ResolvedNumberProperty;
                if (numberProperty.enumValues) {
                    innerComponent = <TableSelect name={propertyKey as string}
                                                  multiple={false}
                                                  disabled={disabled}
                                                  focused={focused}
                                                  valueType={"number"}
                                                  small={getPreviewSizeFrom(size) !== "regular"}
                                                  enumValues={numberProperty.enumValues}
                                                  error={error}
                                                  onBlur={onBlur}
                                                  internalValue={internalValue as string | number}
                                                  updateValue={updateValue}
                    />;
                    fullHeight = true;
                } else {
                    innerComponent = <NumberTableInput
                        align={align}
                        error={error}
                        focused={focused}
                        disabled={disabled}
                        onBlur={onBlur}
                        value={internalValue as number}
                        updateValue={updateValue}
                    />;
                    allowScroll = true;
                }
            } else if (selected && property.dataType === "string") {
                const stringProperty = property as ResolvedStringProperty;
                if (stringProperty.enumValues) {
                    innerComponent = <TableSelect name={propertyKey as string}
                                                  multiple={false}
                                                  focused={focused}
                                                  disabled={disabled}
                                                  valueType={"string"}
                                                  small={getPreviewSizeFrom(size) !== "regular"}
                                                  enumValues={stringProperty.enumValues}
                                                  error={error}
                                                  onBlur={onBlur}
                                                  internalValue={internalValue as string | number}
                                                  updateValue={updateValue}
                    />;
                    fullHeight = true;
                } else if (!stringProperty.storage && !stringProperty.markdown) {
                    const multiline = !!stringProperty.multiline;
                    innerComponent = <TableInput error={error}
                                                 disabled={disabled}
                                                 multiline={multiline}
                                                 focused={focused}
                                                 value={internalValue as string}
                                                 updateValue={updateValue}
                    />;
                    allowScroll = true;
                }
            } else if (property.dataType === "boolean") {
                innerComponent = <TableSwitch error={error}
                                              disabled={disabled}
                                              focused={focused && selected}
                                              internalValue={internalValue as boolean}
                                              updateValue={updateValue}
                />;
            } else if (property.dataType === "date") {
                innerComponent = <TableDateField name={propertyKey as string}
                                                 error={error}
                                                 disabled={disabled}
                                                 mode={property.mode}
                                                 focused={focused}
                                                 internalValue={internalValue as Date}
                                                 updateValue={updateValue}
                />;
                allowScroll = true;
            } else if (property.dataType === "reference") {
                if (typeof property.path === "string") {
                    innerComponent =
                        <TableReferenceField name={propertyKey as string}
                                             internalValue={internalValue as EntityReference}
                                             updateValue={updateValue}
                                             disabled={disabled}
                                             size={size}
                                             path={property.path}
                                             multiselect={false}
                                             previewProperties={property.previewProperties}
                                             title={property.name}
                                             forceFilter={property.forceFilter}
                        />;
                }
                allowScroll = false;
            } else if (property.dataType === "array") {
                const arrayProperty = (property as ResolvedArrayProperty);

                if (!arrayProperty.of && !arrayProperty.oneOf) {
                    throw Error(`You need to specify an 'of' or 'oneOf' prop (or specify a custom field) in your array property ${propertyKey}`);
                }
                if (arrayProperty.of && !Array.isArray(arrayProperty.of)) {
                    if (arrayProperty.of.dataType === "string" || arrayProperty.of.dataType === "number") {
                        if (selected && arrayProperty.of.enumValues) {
                            innerComponent =
                                <TableSelect name={propertyKey as string}
                                             multiple={true}
                                             disabled={disabled}
                                             focused={focused}
                                             small={getPreviewSizeFrom(size) !== "regular"}
                                             valueType={arrayProperty.of.dataType}
                                             enumValues={arrayProperty.of.enumValues}
                                             error={error}
                                             onBlur={onBlur}
                                             internalValue={internalValue as string | number}
                                             updateValue={updateValue}
                                />;
                            allowScroll = true;
                            fullHeight = true;
                        }
                    } else if (arrayProperty.of.dataType === "reference") {
                        if (typeof arrayProperty.of.path === "string") {
                            innerComponent =
                                <TableReferenceField
                                    name={propertyKey as string}
                                    disabled={disabled}
                                    internalValue={internalValue as EntityReference[]}
                                    updateValue={updateValue}
                                    size={size}
                                    multiselect={true}
                                    path={arrayProperty.of.path}
                                    previewProperties={arrayProperty.of.previewProperties}
                                    title={arrayProperty.of.name}
                                    forceFilter={arrayProperty.of.forceFilter}
                                />;
                        }
                        allowScroll = false;
                    }
                }

            }
        }

        if (!innerComponent) {
            allowScroll = false;
            showExpandIcon = selected && !innerComponent && !disabled && !readOnly;
            innerComponent = (
                <PropertyPreview
                    width={width}
                    height={height}
                    entity={entity}
                    propertyKey={propertyKey as string}
                    value={internalValue}
                    property={property}
                    size={getPreviewSizeFrom(size)}
                />
            );
        }

        return (
            <ErrorBoundary>
                <TableCell
                    key={`table_cell_${entity.id}_${propertyKey}`}
                    size={size}
                    width={width}
                    focused={focused}
                    onSelect={onSelect}
                    selected={selected}
                    disabled={disabled || readOnly}
                    disabledTooltip={disabledTooltip ?? "Disabled"}
                    removePadding={removePadding}
                    fullHeight={fullHeight}
                    saved={saved}
                    error={error}
                    align={align}
                    allowScroll={allowScroll}
                    showExpandIcon={showExpandIcon}
                    openPopup={!disabled ? openPopup : undefined}
                    value={internalValue}
                >

                    {innerComponent}

                </TableCell>
            </ErrorBoundary>
        );

    },
    areEqual) as React.FunctionComponent<PropertyTableCellProps<any, any>>;

function areEqual(prevProps: PropertyTableCellProps<any, any>, nextProps: PropertyTableCellProps<any, any>) {
    return prevProps.height === nextProps.height &&
        prevProps.propertyKey === nextProps.propertyKey &&
        prevProps.align === nextProps.align &&
        prevProps.width === nextProps.width &&
        equal(prevProps.property, nextProps.property) &&
        equal(prevProps.value, nextProps.value) &&
        equal(prevProps.entity.values, nextProps.entity.values)
        ;
}
