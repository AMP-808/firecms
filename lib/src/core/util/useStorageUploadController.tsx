import equal from "react-fast-compare";

import { resolveStorageString } from "./storage";
import {
    EntityValues,
    Property,
    ResolvedArrayProperty,
    ResolvedStringProperty,
    StorageConfig,
    StorageSource,
    StringProperty
} from "../../models";
import { useCallback, useEffect, useState } from "react";
import { PreviewSize } from "../../preview";
import { randomString } from "./strings";

/**
 * Internal representation of an item in the storage
 * It can have two states, having a storagePathOrDownloadUrl set,
 * which means the file has been uploaded, and it is rendered as a preview
 * Or have a pending file being uploaded.
 */
export interface StorageFieldItem {
    id: number; // generated on the fly for internal use only
    storagePathOrDownloadUrl?: string;
    file?: File;
    fileName?: string;
    metadata?: any,
    size: PreviewSize
}

export function useStorageUploadController<M>({
                                                  entityId,
                                                  entityValues,
                                                  path,
                                                  value,
                                                  property,
                                                  propertyKey,
                                                  storageSource,
                                                  disabled,
                                                  onChange
                                              }:
                                                  {
                                                      entityId: string,
                                                      entityValues: EntityValues<M>,
                                                      value: string | string[] | null;
                                                      path: string,
                                                      propertyKey: string,
                                                      property: ResolvedStringProperty | ResolvedArrayProperty<string[]>,
                                                      storageSource: StorageSource,
                                                      disabled: boolean,
                                                      onChange: (value: string | string[] | null) => void
                                                  }) {

    const storage: StorageConfig | undefined = property.dataType === "string"
        ? property.storage
        : property.dataType === "array" &&
        (property.of as Property).dataType === "string"
            ? (property.of as StringProperty).storage
            : undefined;

    const multipleFilesSupported = property.dataType === "array";

    if (!storage)
        throw Error("Storage meta must be specified");

    const metadata: Record<string, unknown> | undefined = storage?.metadata;
    const size = multipleFilesSupported ? "small" : "regular";

    const internalInitialValue: StorageFieldItem[] =
        (multipleFilesSupported
            ? (value ?? []) as string[]
            : value ? [value as string] : []).map(entry => (
            {
                id: getRandomId(),
                storagePathOrDownloadUrl: entry,
                metadata: metadata,
                size: size
            }
        ));

    const [initialValue, setInitialValue] = useState<string | string[] | null>(value);
    const [internalValue, setInternalValue] = useState<StorageFieldItem[]>(internalInitialValue);

    useEffect(() => {
        if (!equal(initialValue, value)) {
            setInitialValue(value);
            setInternalValue(internalInitialValue);
        }
    }, [internalInitialValue, value, initialValue]);

    const fileNameBuilder = useCallback((file: File) => {
        if (storage.fileName) {

            const fileName = resolveStorageString(storage.fileName, storage, entityValues, entityId, path, property, file, propertyKey);
            if (!fileName || fileName.length === 0) {
                throw Error("You need to return a valid filename");
            }
            return fileName;
        }
        return randomString() + "_" + file.name;
    }, [entityId, entityValues, path, property, propertyKey, storage]);

    const storagePathBuilder = useCallback((file: File) => {
        return resolveStorageString(storage.storagePath, storage, entityValues, entityId, path, property, file, propertyKey) ?? "/";
    }, [entityId, entityValues, path, property, propertyKey, storage]);

    const onFileUploadComplete = useCallback(async (uploadedPath: string,
                                                    entry: StorageFieldItem,
                                                    metadata?: any) => {

        console.debug("onFileUploadComplete", uploadedPath, entry);

        let uploadPathOrDownloadUrl = uploadedPath;
        if (storage.storeUrl) {
            uploadPathOrDownloadUrl = (await storageSource.getDownloadURL(uploadedPath)).url;
        }
        if (storage.postProcess) {
            uploadPathOrDownloadUrl = await storage.postProcess(uploadPathOrDownloadUrl);
        }

        let newValue: StorageFieldItem[];

        entry.storagePathOrDownloadUrl = uploadPathOrDownloadUrl;
        entry.metadata = metadata;
        newValue = [...internalValue];

        newValue = removeDuplicates(newValue);
        setInternalValue(newValue);

        const fieldValue = newValue
            .filter(e => !!e.storagePathOrDownloadUrl)
            .map(e => e.storagePathOrDownloadUrl as string);

        if (multipleFilesSupported) {
            onChange(fieldValue);
        } else {
            onChange(fieldValue ? fieldValue[0] : null);
        }
    }, [internalValue, multipleFilesSupported, onChange, storage, storageSource]);

    const onFilesAdded = useCallback((acceptedFiles: File[]) => {

        if (!acceptedFiles.length || disabled)
            return;

        let newInternalValue: StorageFieldItem[];
        if (multipleFilesSupported) {
            newInternalValue = [...internalValue,
                ...(acceptedFiles.map(file => ({
                    id: getRandomId(),
                    file,
                    fileName: fileNameBuilder(file),
                    metadata,
                    size: size
                } as StorageFieldItem)))];
        } else {
            newInternalValue = [{
                id: getRandomId(),
                file: acceptedFiles[0],
                fileName: fileNameBuilder(acceptedFiles[0]),
                metadata,
                size: size
            }];
        }

        // Remove either storage path or file duplicates
        newInternalValue = removeDuplicates(newInternalValue);
        setInternalValue(newInternalValue);
    }, [disabled, fileNameBuilder, internalValue, metadata, multipleFilesSupported, size]);

    return {
        internalValue,
        setInternalValue,
        storage,
        fileNameBuilder,
        storagePathBuilder,
        onFileUploadComplete,
        onFilesAdded,
        multipleFilesSupported
    }
}

function removeDuplicates(items: StorageFieldItem[]) {
    return items.filter(
        (item, i) => {
            return ((items.map((v) => v.storagePathOrDownloadUrl).indexOf(item.storagePathOrDownloadUrl) === i) || !item.storagePathOrDownloadUrl) &&
                ((items.map((v) => v.file).indexOf(item.file) === i) || !item.file);
        }
    );
}

function getRandomId() {
    return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
}
