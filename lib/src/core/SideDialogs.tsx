import React, { useContext, useEffect, useState } from "react";
import { useSideDialogsController } from "../hooks/useSideDialogsController";
import { SideDialogDrawer } from "./internal/SideDialogDrawer";
import { ErrorBoundary } from "./components";
import {
    UnsavedChangesDialog,
    useNavigationUnsavedChangesDialog
} from "./internal/useUnsavedChangesDialog";
import { Box } from "@mui/material";
import { SideDialogPanelProps } from "../models";

export type SideDialogContextProps = {
    blocked: boolean,
    setBlocked: (blocked: boolean) => void,
    setBlockedNavigationMessage: (message?: React.ReactNode) => void,
    width?: string,
    setWidth: (width: string) => void,
    close: (force?: boolean) => void
}

const SideDialogContext = React.createContext<SideDialogContextProps>({
    width: "",
    setWidth: (width: string) => {
    },
    blocked: false,
    setBlocked: (blocked: boolean) => {
    },
    setBlockedNavigationMessage: (message?: React.ReactNode) => {
    },
    close: () => {
    }
});

/**
 * This hook is used to access the properties of a particular side dialog,
 * in contrast with {@link useSideDialogsController} which handles the
 * state of all the dialogs.
 */
export const useSideDialogContext = () => useContext<SideDialogContextProps>(SideDialogContext);

/**
 * This is the component in charge of rendering the side dialogs used
 * for editing entities. Use the {@link useSideEntityController} to open
 * and control the dialogs.
 * This component needs a parent {@link FireCMS}
 * {@see useSideDialogsController}
 * @category Components
 */
export function SideDialogs() {

    const sideDialogsController = useSideDialogsController();

    const sidePanels = sideDialogsController.sidePanels;

    const panels: (SideDialogPanelProps | undefined)[] = [...sidePanels];
    panels.push(undefined);

    return <>
        {
            panels.map((panel, index) =>
                <SideDialogView
                    key={`side_dialog_${index}`}
                    panel={panel}
                    offsetPosition={sidePanels.length - index - 1}/>)
        }
    </>;
}

function SideDialogView({
                            offsetPosition,
                            panel
                        }: {
    offsetPosition: number,
    panel?: SideDialogPanelProps
}) {

    // was the closing of the dialog requested by the drawer
    const [drawerCloseRequested, setDrawerCloseRequested] = useState<boolean>(false);
    const [blocked, setBlocked] = useState(false);
    const [blockedNavigationMessage, setBlockedNavigationMessage] = useState<React.ReactNode | undefined>();

    const [width, setWidth] = useState<string | undefined>(panel?.width);
    const [open, setOpen] = useState<boolean>(Boolean(panel));

    const sideDialogsController = useSideDialogsController();

    const {
        navigationWasBlocked,
        handleOk: handleNavigationOk,
        handleCancel: handleNavigationCancel
    } = useNavigationUnsavedChangesDialog(
        blocked && !drawerCloseRequested,
        () => setBlocked(false)
    );

    useEffect(() => {
        setWidth(panel?.width);
        if (panel)
            setTimeout(() => setOpen(true));
        else
            setOpen(false);
    }, [panel])

    const handleDrawerCloseOk = () => {
        setBlocked(false);
        setDrawerCloseRequested(false);
        sideDialogsController.close();
    };

    const handleDrawerCloseCancel = () => {
        setDrawerCloseRequested(false);
    };

    const onCloseRequest = (force?: boolean) => {
        if (blocked && !force) {
            setDrawerCloseRequested(true);
        } else {
            sideDialogsController.close();
        }
    };

    return (
        <SideDialogContext.Provider
            value={{
                blocked,
                setBlocked,
                setBlockedNavigationMessage,
                width,
                setWidth,
                close: onCloseRequest
            }}>

            <SideDialogDrawer
                open={open && Boolean(panel)}
                onClose={onCloseRequest}
                offsetPosition={offsetPosition}
            >
                {panel &&
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                                transition: "width 250ms ease-in-out",
                                width,
                                maxWidth: "100vw"
                            }}>
                            <ErrorBoundary>
                                {panel.Component}
                            </ErrorBoundary>
                        </Box>}

                {!panel && <div style={{ width }}/>}

            </SideDialogDrawer>

            <UnsavedChangesDialog
                open={navigationWasBlocked || drawerCloseRequested}
                handleOk={drawerCloseRequested ? handleDrawerCloseOk : handleNavigationOk}
                handleCancel={drawerCloseRequested ? handleDrawerCloseCancel : handleNavigationCancel}
                body={blockedNavigationMessage}/>

        </SideDialogContext.Provider>

    );
}
