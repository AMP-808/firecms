import React from "react";
import { styled } from "@mui/material/styles";
import { Tooltip } from "@mui/material";
import { tooltipClasses, TooltipProps } from "@mui/material/Tooltip";

export const ErrorTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }}/>
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        margin: "0 8px",
        backgroundColor: theme.palette.error.light
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: theme.palette.error.light
    }
}));
