import { Entity, EntityReference, FieldProps, Property } from "../../models";
import { Box, Button, FormControl, FormHelperText, Paper } from "@mui/material";
import { ReferencePreview } from "../../preview";
import React, { useMemo } from "react";
import LabelWithIcon from "../components/LabelWithIcon";
import ArrayContainer from "../components/ArrayContainer";
import ReferenceDialog from "../../core/components/ReferenceDialog";
import { formStyles } from "../styles";
import FieldDescription from "../components/FieldDescription";
import { useClearRestoreValue } from "../../hooks";
import { useSchemasRegistry } from "../../contexts/SchemaRegistry";
import { ErrorView } from "../../core/components";
import { getReferenceFrom } from "../../models/utils";


type ArrayOfReferencesFieldProps = FieldProps<EntityReference[]>;

/**
 * This field allows to select multiple references.
 *
 * This is one of the internal components that get mapped natively inside forms
 * and tables to the specified properties.
 * @category Form fields
 */
export default function ArrayOfReferencesField({
                                                   name,
                                                   value,
                                                   error,
                                                   showError,
                                                   isSubmitting,
                                                   tableMode,
                                                   property,
                                                   includeDescription,
                                                   setValue
                                               }: ArrayOfReferencesFieldProps) {

    const classes = formStyles();

    const ofProperty: Property = property.of as Property;
    if (ofProperty.dataType !== "reference") {
        throw Error("ArrayOfReferencesField expected a property containing references");
    }

    const [open, setOpen] = React.useState(false);
    const selectedIds = value && Array.isArray(value) ? value.map((ref) => ref.id) : [];

    useClearRestoreValue({
        property,
        value,
        setValue
    });

    const schemaRegistry = useSchemasRegistry();
    const collectionConfig = useMemo(() => {
        return schemaRegistry.getCollectionConfig(ofProperty.path);
    }, [ofProperty.path]);

    if (!collectionConfig) {
        console.error(`Couldn't find the corresponding collection view for the path: ${ofProperty.path}`);
    }

    const onEntryClick = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const onMultipleEntitiesSelected = (entities: Entity<any>[]) => {
        setValue(entities.map(e => getReferenceFrom(e)));
    };

    const buildEntry = (index: number, internalId: number) => {
        const entryValue = value && value.length > index ? value[index] : undefined;
        if (!entryValue)
            return <div>Internal ERROR</div>;
        return <ReferencePreview
            value={entryValue}
            property={ofProperty}
            size={"regular"}
            onClick={onEntryClick}/>;
    };


    return (
        <>
            <FormControl fullWidth error={showError}>

                {!tableMode && <FormHelperText filled
                                               required={property.validation?.required}>
                    <LabelWithIcon scaledIcon={true} property={property}/>
                </FormHelperText>}

                <Paper variant={"outlined"}
                       className={classes.paper}>
                    {!collectionConfig && <ErrorView
                        error={"The specified collection does not exist. Check console"}/>}

                    {collectionConfig && <>
                        <ArrayContainer value={value}
                                        name={name}
                                        buildEntry={buildEntry}
                                        disabled={isSubmitting}/>

                        <Box p={1}
                             justifyContent="center"
                             textAlign={"left"}>
                            <Button variant="outlined"
                                    color="primary"
                                    disabled={isSubmitting}
                                    onClick={onEntryClick}>
                                Edit {property.title}
                            </Button>
                        </Box>
                    </>}

                </Paper>

                {includeDescription &&
                <FieldDescription property={property}/>}

                {showError
                && typeof error === "string"
                && <FormHelperText>{error}</FormHelperText>}

            </FormControl>

            {collectionConfig && <ReferenceDialog open={open}
                                                  multiselect={true}
                                                  collection={collectionConfig}
                                                  path={ofProperty.path}
                                                  onClose={onClose}
                                                  onMultipleEntitiesSelected={onMultipleEntitiesSelected}
                                                  selectedEntityIds={selectedIds}
            />}
        </>
    );
}


