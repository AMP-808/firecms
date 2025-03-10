import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SideDialogPanelProps, SideDialogsController } from "../../models";
import equal from "react-fast-compare"

export function useBuildSideDialogsController(): SideDialogsController {

    const location = useLocation();
    const navigate = useNavigate();

    const [sidePanels, setSidePanels] = useState<SideDialogPanelProps[]>([]);

    const routesStore = useRef<Record<string, SideDialogPanelProps>>({});
    const routesCount = useRef<number>(0);

    useEffect(() => {
        const state = location.state as any;
        const panelKeys: string[] = state?.panels ?? [];
        // const newPanels = sidePanels.filter(panel => panelKeys.includes(panel.key) || !panel.urlPath);
        const newPanels = panelKeys
            .map(key => routesStore.current[key])
            .filter(p => Boolean(p)) as SideDialogPanelProps[];
        // if (!equal(sidePanels.map(p => p.key), newPanels.map(p => p.key)))
            setSidePanels(newPanels);
    }, [location]);

    const close = useCallback(() => {

        if (sidePanels.length === 0)
            return;

        const lastSidePanel = sidePanels[sidePanels.length - 1];
        const updatedPanels = [...sidePanels.slice(0, -1)];
        setSidePanels(updatedPanels);

        if (routesCount.current > 0) {
            if (lastSidePanel.urlPath)
                navigate(-1);
            routesCount.current--;
        } else if (lastSidePanel.parentUrlPath) {
            const baseLocation = (location.state as any)?.base_location ?? location;
            navigate(
                lastSidePanel.parentUrlPath,
                {
                    replace: true,
                    state: {
                        base_location: baseLocation,
                        panels: updatedPanels.map(p => p.key)
                    }
                }
            );
        }
    }, [sidePanels, navigate, location]);

    const open = useCallback((panelProps: SideDialogPanelProps | SideDialogPanelProps[]) => {

        const newPanels: SideDialogPanelProps[] = Array.isArray(panelProps) ? panelProps : [panelProps];

        newPanels.forEach((panel) => {
            routesStore.current[panel.key] = panel;
        });
        routesCount.current = routesCount.current + newPanels.length;

        const baseLocation = (location.state as any)?.base_location ?? location;

        const updatedPanels = [...sidePanels, ...newPanels];
        setSidePanels(updatedPanels);

        newPanels.forEach((panel) => {
            if (panel.urlPath) {
                navigate(
                    panel.urlPath,
                    {
                        state: {
                            base_location: baseLocation,
                            panels: updatedPanels.map(p => p.key)
                        }
                    }
                );
            }
        });

    }, [location, navigate, sidePanels]);

    const replace = useCallback((panelProps: SideDialogPanelProps | SideDialogPanelProps[]) => {

        const newPanels: SideDialogPanelProps[] = Array.isArray(panelProps) ? panelProps : [panelProps];
        newPanels.forEach((panel) => {
            routesStore.current[panel.key] = panel;
        });

        const baseLocation = (location.state as any)?.base_location ?? location;

        const updatedPanels = [...sidePanels.slice(0, -newPanels.length), ...newPanels];
        setSidePanels(updatedPanels);

        newPanels.forEach((panel) => {
            if (panel.urlPath) {
                navigate(
                    panel.urlPath,
                    {
                        replace: true,
                        state: {
                            base_location: baseLocation,
                            panels: updatedPanels.map(p => p.key)
                        }
                    }
                );
            }
        });

    }, [location, navigate, sidePanels]);

    return {
        sidePanels,
        close,
        open,
        replace
    };
}
