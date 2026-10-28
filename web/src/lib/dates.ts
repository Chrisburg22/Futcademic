import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Los `DateInput` con `valueFormat="DD/MM/YYYY"` delegan el parseo del texto en
// dayjs. Sin este plugin dayjs ignora el formato y cae en `new Date()`, que en
// Chrome lee "04/03/2015" como 3 de abril (mes/día) en vez de 4 de marzo.
dayjs.extend(customParseFormat);
