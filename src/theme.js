import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    brand: {
      50: "#f5e6ff",
      100: "#e8b3ff",
      200: "#db80ff",
      300: "#ce4dff",
      400: "#c11aff",
      500: "#a800e6",
      600: "#8500b3",
      700: "#620080",
      800: "#3f004d",
      900: "#1c001a",
    },
  },
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "gray.800",
        color: "white",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "lg",
      },
      variants: {
        solid: {
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          bg: "gray.700",
          borderColor: "gray.600",
          _hover: {
            borderColor: "brand.500",
          },
          _focus: {
            borderColor: "brand.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
          },
        },
      },
    },
    Table: {
      baseStyle: {
        th: {
          color: "gray.200",
          borderColor: "gray.600",
        },
        td: {
          color: "gray.200",
          borderColor: "gray.600",
        },
      },
    },
    Box: {
      baseStyle: {
        bg: "gray.700",
      },
    },
    Stat: {
      baseStyle: {
        label: {
          color: "gray.200",
        },
        number: {
          color: "white",
        },
        helpText: {
          color: "gray.400",
        },
      },
    },
  },
});

export { theme };
