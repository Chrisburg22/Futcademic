import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

// La app es solo en español: sin esto, los meses salían en inglés
// ("October 2026") y el selector de fecha mostraba "October 28, 2026".
dayjs.locale('es');

// Los `DateInput` con `valueFormat="DD/MM/YYYY"` delegan el parseo del texto en
// dayjs. Sin este plugin dayjs ignora el formato y cae en `new Date()`, que en
// Chrome lee "04/03/2015" como 3 de abril (mes/día) en vez de 4 de marzo.
dayjs.extend(customParseFormat);
