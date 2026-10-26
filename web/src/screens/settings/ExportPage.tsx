import { Card, Stack, Button, Text, Group } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/axios';
import { PageHeader } from '../../components/common/PageHeader';

function downloadCsv(filename: string, rows: any[]) {
  if (!rows.length) {
    notifications.show({ color: 'orange', message: 'Sin datos para exportar' });
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          if (v == null) return '';
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(','),
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPage() {
  const exportPath = async (path: string, file: string) => {
    try {
      const { data } = await api.get(path);
      downloadCsv(file, Array.isArray(data) ? data : []);
    } catch {
      notifications.show({ color: 'red', message: 'Error al exportar' });
    }
  };

  return (
    <>
      <PageHeader title="Exportar datos" description="Descarga tu información en CSV" />
      <Card withBorder padding="lg" radius="md" maw={600}>
        <Stack>
          <Group justify="space-between">
            <Text>Pagos (CSV del servidor)</Text>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              onClick={() => exportPath('/export/payments', 'pagos_export.csv')}
            >
              CSV
            </Button>
          </Group>
          <Group justify="space-between">
            <Text>Asistencia (CSV del servidor)</Text>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              onClick={() => exportPath('/export/attendance', 'asistencia_export.csv')}
            >
              CSV
            </Button>
          </Group>
          <Group justify="space-between">
            <Text>Alumnos (generado en cliente)</Text>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              onClick={() => exportPath('/students', 'alumnos.csv')}
            >
              CSV
            </Button>
          </Group>
          <Group justify="space-between">
            <Text>Categorías (generado en cliente)</Text>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              onClick={() => exportPath('/categories', 'categorias.csv')}
            >
              CSV
            </Button>
          </Group>
        </Stack>
      </Card>
    </>
  );
}
