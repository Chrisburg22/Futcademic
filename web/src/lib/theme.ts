import { createTheme, type MantineColorsTuple } from '@mantine/core';

const futcamedic: MantineColorsTuple = [
  '#e8f5ee',
  '#cfe7d8',
  '#9ecdb1',
  '#6ab287',
  '#42a067',
  '#299555',
  '#198d4b',
  '#067a3d',
  '#006d35',
  '#005d2c',
];

export const theme = createTheme({
  primaryColor: 'futcamedic',
  colors: { futcamedic },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: { defaultProps: { fw: 600 } },
  },
});
