import { createTheme, virtualColor } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "indigo",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: "md",
  colors: {
    darkBg: [
      "#f5f5f7",
      "#e8e8ec",
      "#d1d1d8",
      "#b0b0bb",
      "#8888a0",
      "#6b6b85",
      "#4a4a66",
      "#2a2a44",
      "#1a1a2e",
      "#12121f",
    ],
    brand: virtualColor({
      name: "brand",
      light: "#4f46e5",
      dark: "#818cf8",
    }),
  },
  primaryShade: { light: 6, dark: 7 },
  components: {
    Table: {
      defaultProps: {
        striped: true,
        highlightOnHover: true,
        withTableBorder: true,
        withColumnBorders: false,
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
        padding: "lg",
      },
    },
    Paper: {
      defaultProps: {
        withBorder: true,
        p: "md",
      },
    },
  },
});
