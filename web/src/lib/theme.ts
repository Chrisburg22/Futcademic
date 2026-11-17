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

/*
 * Suelo táctil de 44 px.
 *
 * `defaultProps` no gana contra una prop explícita: un `Button size="compact-sm"`
 * escrito en el código seguiría midiendo ~26 px. Lo que sí gana siempre es el
 * CSS, así que los controles llevan además la clase `touch-target`, cuyo
 * `min-height`/`min-width` vive en `src/styles/globals.css` bajo 48em.
 * `defaultProps.size` solo sube el punto de partida de quien no pide tamaño.
 */
const TOUCH_TARGET = { root: 'touch-target' };

export const theme = createTheme({
  primaryColor: 'futcamedic',
  colors: { futcamedic },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: { defaultProps: { fw: 600, size: 'md' }, classNames: TOUCH_TARGET },
    ActionIcon: { defaultProps: { size: 'lg' }, classNames: TOUCH_TARGET },
    // El cuadro del checkbox no debe crecer; la zona sensible sí (`touch-row`).
    Checkbox: { defaultProps: { size: 'md' }, classNames: { root: 'touch-row' } },
    Radio: { defaultProps: { size: 'md' }, classNames: { root: 'touch-row' } },
    Switch: { defaultProps: { size: 'md' }, classNames: { root: 'touch-row' } },
    TextInput: { defaultProps: { size: 'md' } },
    PasswordInput: { defaultProps: { size: 'md' } },
    Textarea: { defaultProps: { size: 'md' } },
    NumberInput: { defaultProps: { size: 'md' } },
    DateInput: { defaultProps: { size: 'md' } },
    // `withinPortal` evita que el desplegable quede recortado dentro de un
    // Drawer o un BottomSheet.
    Select: { defaultProps: { size: 'md', comboboxProps: { withinPortal: true } } },
    MultiSelect: { defaultProps: { size: 'md', comboboxProps: { withinPortal: true } } },
    /*
     * Parche para los Tooltip que queden sin migrar a InfoPopover: al menos se
     * abren con tap. No sustituye la migración — un Tooltip táctil se cierra al
     * tocar cualquier otra cosa y no es enfocable.
     */
    Tooltip: { defaultProps: { events: { hover: true, focus: true, touch: true } } },
  },
});
