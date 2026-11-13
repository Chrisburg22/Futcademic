'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
  Modal,
  NumberInput,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { DateInput } from '@mantine/dates';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconCash,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconCoin,
  IconDownload,
  IconPlus,
  IconSearch,
  IconTargetArrow,
  IconUser,
  IconWallet,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import {
  useGetPayments,
  useGetPaymentsSummary,
  useGetPendingPayments,
  useGetPaymentsByStudent,
  useGetAccountStatement,
  useRegisterStudentPayment,
  useRegisterTeacherPayment,
} from '../hooks/usePayments';
import { useGetStudents, useGetMyChildren } from '../hooks/useStudents';
import { useGetTeachers } from '../hooks/useUsers';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { TouchRow } from '../components/common/TouchRow';
import { ErrorState } from '../components/common/ErrorState';
import { useRegisterChatScreen } from '../contexts/ChatScreenContext';
import {
  OPCIONES_ORDEN_COBRANZA,
  VISTA_PARA_CHAT,
  construirTendencia,
  escribirPeriodoEnUrl,
  leerPeriodo,
  leerTab,
  mesDelResumen,
  mismoPeriodo,
  montoSugerido,
  moverPeriodo,
  periodoActual,
  periodoLegible,
  pesos,
  prepararCobranza,
  tasaCobranza,
  variacion,
  type OrdenCobranza,
  type PendienteDelMes,
  type Periodo,
  type TabFinanzas,
} from '../lib/finanzas';

const months = Array.from({ length: 12 }).map((_, i) => ({
  value: String(i + 1),
  label: dayjs().month(i).format('MMMM').replace(/^./, (c) => c.toUpperCase()),
}));

/** Preselección al abrir el modal: viene de una fila de cobranza o de la nómina. */
type Preseleccion = {
  tipo: 'student' | 'teacher';
  personId?: string;
  amount?: number;
  descripcion?: string;
} | null;

export function FinancesPage() {
  const { profile } = useAuth();
  if (profile?.role === 'padre') return <ParentFinances />;
  return <AdminFinances />;
}

// ── Admin ─────────────────────────────────────────────────────────────────

function AdminFinances() {
  const router = useRouter();
  const consulta = useSearchParams();
  const [periodo, setPeriodo] = useState<Periodo>(() => leerPeriodo(consulta));
  const [tab, setTab] = useState<TabFinanzas>(() => leerTab(consulta.get('tab')));
  const [opened, { open, close }] = useDisclosure(false);
  const [preseleccion, setPreseleccion] = useState<Preseleccion>(null);

  const { mes, anio } = periodo;
  const actual = periodoActual();

  // El periodo y la vista quedan en la URL para poder compartir "la cobranza
  // de octubre" y para que el asistente reciba el mismo contexto.
  useEffect(() => {
    router.replace(`/finances?${escribirPeriodoEnUrl(periodo, tab)}`, { scroll: false });
  }, [periodo, tab, router]);

  const { data: resumen, isLoading: cargandoResumen } = useGetPaymentsSummary(anio);
  const { data: pendientesData, isLoading: cargandoPendientes } = useGetPendingPayments({
    month: mes,
    year: anio,
  });
  const { data: pagos = [], isLoading: cargandoPagos } = useGetPayments({
    type: 'mensualidad',
    month: mes,
    year: anio,
  });
  const { data: nomina = [], isLoading: cargandoNomina } = useGetPayments({
    type: 'pago_profesor',
    month: mes,
    year: anio,
  });

  const cifras = mesDelResumen(resumen, mes);
  const pendientes = (pendientesData?.pending || []) as PendienteDelMes[];
  const porCobrar = Number(pendientesData?.total_pending_amount) || 0;
  const totalAlumnos = Number(pendientesData?.total_students) || 0;
  const alCorriente = Math.max(0, totalAlumnos - pendientes.length);
  const tasa = tasaCobranza(cifras.collected, porCobrar);
  const esperado = cifras.collected + porCobrar;

  // Solo se compara con el mes anterior del mismo año: el resumen es anual.
  const anterior = mes > 1 ? mesDelResumen(resumen, mes - 1) : null;
  const deltaCobrado = anterior ? variacion(cifras.collected, anterior.collected) : null;
  const deltaNomina = anterior ? variacion(cifras.payroll, anterior.payroll) : null;

  const tendencia = useMemo(
    () => construirTendencia(resumen, periodo, 6),
    [resumen, periodo],
  );

  useRegisterChatScreen({
    screen: 'Finanzas',
    filters: [
      { label: 'Mes', value: `${anio}-${String(mes).padStart(2, '0')}` },
      { label: 'Vista', value: VISTA_PARA_CHAT[tab] },
    ],
  });

  const abrirPago = (pre: Preseleccion) => {
    setPreseleccion(pre);
    open();
  };

  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced] = useDebouncedValue(busqueda, 200);
  const [orden, setOrden] = useState<OrdenCobranza>('adeudo_desc');
  const cobranza = useMemo(
    () => prepararCobranza(pendientes, busquedaDebounced, orden),
    [pendientes, busquedaDebounced, orden],
  );

  return (
    <>
      <PageHeader
        title="Finanzas"
        description="Cobranza del mes y gasto en nómina de la academia"
        actions={
          <Group gap="xs">
            <Button
              component={Link}
              href="/settings/export"
              variant="default"
              leftSection={<IconDownload size={16} />}
            >
              Exportar
            </Button>
            <Button onClick={() => abrirPago(null)} leftSection={<IconPlus size={16} />}>
              Registrar pago
            </Button>
          </Group>
        }
      />

      <SelectorDePeriodo
        periodo={periodo}
        onCambiar={setPeriodo}
        alCorriente={alCorriente}
        totalAlumnos={totalAlumnos}
      />

      <SimpleGrid cols={{ base: 2, lg: 4 }} mb="md" spacing="md">
        <KpiFinanciero
          label="Cobrado"
          value={pesos(cifras.collected)}
          hint={`${pagos.length} ${pagos.length === 1 ? 'pago registrado' : 'pagos registrados'}`}
          icon={<IconCash size={20} />}
          color="futcamedic"
          delta={deltaCobrado}
          cargando={cargandoResumen}
        />
        <KpiFinanciero
          label="Por cobrar"
          value={pesos(porCobrar)}
          hint={
            pendientes.length
              ? `${pendientes.length} de ${totalAlumnos} alumnos con adeudo`
              : 'Todos al corriente'
          }
          icon={<IconCoin size={20} />}
          color="orange"
          cargando={cargandoPendientes}
        />
        <KpiFinanciero
          label="Tasa de cobranza"
          value={tasa == null ? '—' : `${tasa}%`}
          hint={esperado ? `de ${pesos(esperado)} esperados` : 'Sin alumnos activos que cobrar'}
          icon={<IconTargetArrow size={20} />}
          color="blue"
          cargando={cargandoResumen || cargandoPendientes}
          extra={
            tasa != null ? (
              <Progress
                value={tasa}
                size="sm"
                radius="xl"
                mt="xs"
                color={tasa >= 80 ? 'teal' : tasa >= 50 ? 'blue' : 'orange'}
                aria-label={`Tasa de cobranza ${tasa}%`}
              />
            ) : null
          }
        />
        <KpiFinanciero
          label="Nómina de profesores"
          value={pesos(cifras.payroll)}
          hint={`Margen ${pesos(cifras.margin)}`}
          icon={<IconWallet size={20} />}
          color="grape"
          delta={deltaNomina}
          deltaInvertida
          cargando={cargandoResumen}
        />
      </SimpleGrid>

      <Tabs value={tab} onChange={(valor) => setTab((valor as TabFinanzas) || 'cobranza')} keepMounted>
        <Tabs.List grow>
          <Tabs.Tab value="cobranza">
            Cobranza{pendientes.length > 0 ? ` (${pendientes.length})` : ''}
          </Tabs.Tab>
          <Tabs.Tab value="pagos">Pagos del mes</Tabs.Tab>
          <Tabs.Tab value="nomina">Nómina</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cobranza" pt="md">
          <PanelCobranza
            pendientes={cobranza}
            totalPendientes={pendientes.length}
            totalAlumnos={totalAlumnos}
            porCobrar={porCobrar}
            mes={mes}
            cargando={cargandoPendientes}
            busqueda={busqueda}
            onBuscar={setBusqueda}
            orden={orden}
            onOrdenar={setOrden}
            onCobrar={(p) =>
              abrirPago({
                tipo: 'student',
                personId: p.id,
                amount: montoSugerido(p),
                descripcion: `Mensualidad ${dayjs().month(mes - 1).format('MMMM')}`,
              })
            }
            onRegistrar={() => abrirPago(null)}
          />
        </Tabs.Panel>

        <Tabs.Panel value="pagos" pt="md">
          <PanelPagos pagos={pagos} cargando={cargandoPagos} mes={mes} onRegistrar={() => abrirPago(null)} />
        </Tabs.Panel>

        <Tabs.Panel value="nomina" pt="md">
          <PanelNomina
            nomina={nomina}
            cargando={cargandoNomina}
            mes={mes}
            onRegistrar={() => abrirPago({ tipo: 'teacher' })}
          />
        </Tabs.Panel>
      </Tabs>

      <TarjetaTendencia
        tendencia={tendencia}
        resumen={resumen}
        cargando={cargandoResumen}
        margenMes={cifras.margin}
      />

      <RegistrarPagoModal
        opened={opened}
        onClose={close}
        preseleccion={preseleccion}
        pendientes={pendientes}
        mes={mes}
      />
    </>
  );
}

// ── Selector de periodo ───────────────────────────────────────────────────

function SelectorDePeriodo({
  periodo,
  onCambiar,
  alCorriente,
  totalAlumnos,
}: {
  periodo: Periodo;
  onCambiar: (p: Periodo) => void;
  alCorriente: number;
  totalAlumnos: number;
}) {
  const esActual = mismoPeriodo(periodo, periodoActual());

  return (
    <Card withBorder padding="sm" radius="md" mb="md">
      <Group justify="space-between" gap="sm" wrap="wrap">
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Mes anterior"
            onClick={() => onCambiar(moverPeriodo(periodo, -1))}
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Box miw={140} ta="center">
            <Text fw={600} tt="capitalize" lh={1.2}>
              {periodoLegible(periodo)}
            </Text>
            <Text size="xs" c="dimmed">
              {esActual ? 'Mes en curso' : 'Periodo consultado'}
            </Text>
          </Box>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Mes siguiente"
            onClick={() => onCambiar(moverPeriodo(periodo, 1))}
          >
            <IconChevronRight size={18} />
          </ActionIcon>
          {!esActual && (
            <Button variant="subtle" size="sm" onClick={() => onCambiar(periodoActual())}>
              Mes actual
            </Button>
          )}
        </Group>
        {totalAlumnos > 0 && (
          <Badge variant="light" color="futcamedic" size="lg" radius="sm">
            {alCorriente} de {totalAlumnos} alumnos al corriente
          </Badge>
        )}
      </Group>
    </Card>
  );
}

// ── Tarjetas de cifras ────────────────────────────────────────────────────

function KpiFinanciero({
  label,
  value,
  hint,
  icon,
  color,
  cargando,
  delta,
  /** La nómina baja es una buena noticia: invierte el color del delta. */
  deltaInvertida,
  extra,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  color: string;
  cargando?: boolean;
  delta?: number | null;
  deltaInvertida?: boolean;
  extra?: React.ReactNode;
}) {
  const positivo = delta != null && (deltaInvertida ? delta <= 0 : delta >= 0);
  const IconoDelta = delta != null && delta >= 0 ? IconArrowUpRight : IconArrowDownRight;

  return (
    <Card withBorder padding="md" radius="md" h="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" lh={1.3}>
          {label}
        </Text>
        <ThemeIcon size={36} radius="md" variant="light" color={color} visibleFrom="sm">
          {icon}
        </ThemeIcon>
      </Group>
      {cargando ? (
        <Skeleton height={30} width="55%" mt="sm" />
      ) : (
        <Group gap={8} align="baseline" wrap="nowrap" mt="xs">
          <Text
            fw={700}
            fz={{ base: 23, sm: 28 }}
            lh={1.2}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </Text>
          {delta != null && (
            <Tooltip label="Vs. el mes anterior" withArrow>
              <Badge
                size="xs"
                variant="light"
                color={positivo ? 'teal' : 'red'}
                leftSection={<IconoDelta size={10} />}
                aria-label={`${Math.abs(delta)}% contra el mes anterior`}
                style={{ flexShrink: 0 }}
              >
                {Math.abs(delta)}%
              </Badge>
            </Tooltip>
          )}
        </Group>
      )}
      {extra}
      <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
        {hint}
      </Text>
    </Card>
  );
}

// ── Cobranza ──────────────────────────────────────────────────────────────

function PanelCobranza({
  pendientes,
  totalPendientes,
  totalAlumnos,
  porCobrar,
  mes,
  cargando,
  busqueda,
  onBuscar,
  orden,
  onOrdenar,
  onCobrar,
  onRegistrar,
}: {
  pendientes: PendienteDelMes[];
  totalPendientes: number;
  totalAlumnos: number;
  porCobrar: number;
  mes: number;
  cargando: boolean;
  busqueda: string;
  onBuscar: (valor: string) => void;
  orden: OrdenCobranza;
  onOrdenar: (orden: OrdenCobranza) => void;
  onCobrar: (p: PendienteDelMes) => void;
  onRegistrar: () => void;
}) {
  const nombreMes = dayjs().month(mes - 1).format('MMMM');

  if (cargando) {
    return (
      <Stack gap="xs">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={64} radius="md" />
        ))}
      </Stack>
    );
  }

  if (totalPendientes === 0) {
    return (
      <Card withBorder radius="md" padding="xl">
        <EmptyState
          icon={<IconCircleCheck size={32} />}
          title="Todos al corriente"
          description={
            totalAlumnos > 0
              ? `Los ${totalAlumnos} alumnos activos ya cubrieron su mensualidad de ${nombreMes}.`
              : 'Todavía no hay alumnos activos que generen mensualidad.'
          }
          action={
            <Button variant="light" onClick={onRegistrar} leftSection={<IconPlus size={16} />}>
              Registrar un pago
            </Button>
          }
        />
      </Card>
    );
  }

  const alternarOrden = () => onOrdenar(orden === 'nombre_asc' ? 'nombre_desc' : 'nombre_asc');
  const ordenNombre: 'ascending' | 'descending' | 'none' =
    orden === 'nombre_asc' ? 'ascending' : orden === 'nombre_desc' ? 'descending' : 'none';

  return (
    <Card withBorder radius="md" padding={0}>
      <Group justify="space-between" gap="sm" wrap="wrap" p="md">
        <TextInput
          aria-label="Buscar alumno en la cobranza"
          placeholder="Buscar alumno o categoría"
          leftSection={<IconSearch size={16} />}
          value={busqueda}
          onChange={(e) => onBuscar(e.currentTarget.value)}
          w={{ base: '100%', sm: 260 }}
        />
        <Group gap="sm" wrap="wrap">
          <Select
            aria-label="Ordenar la cobranza"
            data={OPCIONES_ORDEN_COBRANZA}
            value={orden}
            onChange={(valor) => onOrdenar((valor as OrdenCobranza) || 'adeudo_desc')}
            allowDeselect={false}
            w={210}
          />
          <Text size="sm" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {pesos(porCobrar)} por cobrar
          </Text>
        </Group>
      </Group>

      {pendientes.length === 0 ? (
        <Box pb="lg">
          <EmptyState
            title="Sin resultados"
            description={`Ningún alumno coincide con "${busqueda.trim()}".`}
            action={
              <Button variant="light" onClick={() => onBuscar('')}>
                Limpiar búsqueda
              </Button>
            }
          />
        </Box>
      ) : (
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th aria-sort={ordenNombre}>
                <UnstyledButton onClick={alternarOrden} aria-label="Ordenar por nombre">
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    Alumno
                  </Text>
                </UnstyledButton>
              </Table.Th>
              <Table.Th visibleFrom="sm">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Categoría
                </Text>
              </Table.Th>
              <Table.Th visibleFrom="md" ta="right">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Mensualidad
                </Text>
              </Table.Th>
              <Table.Th ta="right">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Debe
                </Text>
              </Table.Th>
              <Table.Th ta="right">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Acción
                </Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pendientes.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon size={30} radius="xl" variant="light" color="gray" aria-hidden>
                      <IconUser size={16} />
                    </ThemeIcon>
                    <Box miw={0}>
                      <Text fw={500} size="sm" lineClamp={2}>
                        {p.full_name}
                      </Text>
                      <Text size="xs" c="dimmed" hiddenFrom="sm">
                        {p.category?.name || 'Sin categoría'}
                      </Text>
                    </Box>
                  </Group>
                </Table.Td>
                <Table.Td visibleFrom="sm">
                  <Text size="sm" c="dimmed">
                    {p.category?.name || '—'}
                  </Text>
                </Table.Td>
                <Table.Td visibleFrom="md" ta="right">
                  <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pesos(p.monthly_fee)}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    Pagó {pesos(p.paid_amount)}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text
                    size="sm"
                    fw={700}
                    c="orange.8"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {pesos(p.pending_amount)}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <Box visibleFrom="sm">
                      <Tooltip label="Ver ficha del alumno" withArrow>
                        <ActionIcon
                          component={Link}
                          href={`/admin/students/${p.id}`}
                          variant="subtle"
                          color="gray"
                          size="lg"
                          aria-label={`Ver ficha de ${p.full_name}`}
                        >
                          <IconUser size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Box>
                    <Button size="sm" variant="light" onClick={() => onCobrar(p)}>
                      Cobrar
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}

// ── Pagos del mes y nómina ────────────────────────────────────────────────

const nombreDelPago = (p: any) =>
  p.student?.full_name ||
  p.teacher?.full_name ||
  (p.payment_students?.length ? `Pago grupal (${p.payment_students.length} alumnos)` : 'Pago');

function PanelPagos({
  pagos,
  cargando,
  mes,
  onRegistrar,
}: {
  pagos: any[];
  cargando: boolean;
  mes: number;
  onRegistrar: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced] = useDebouncedValue(busqueda, 200);

  const filas = useMemo(() => {
    const q = busquedaDebounced.trim().toLowerCase();
    if (!q) return pagos;
    return pagos.filter((p) =>
      `${nombreDelPago(p)} ${p.description || ''}`.toLowerCase().includes(q),
    );
  }, [pagos, busquedaDebounced]);

  const total = pagos.reduce((suma, p) => suma + Number(p.amount || 0), 0);
  const nombreMes = dayjs().month(mes - 1).format('MMMM');

  if (cargando) {
    return (
      <Stack gap="xs">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={64} radius="md" />
        ))}
      </Stack>
    );
  }

  if (pagos.length === 0) {
    return (
      <Card withBorder radius="md" padding="xl">
        <EmptyState
          icon={<IconCash size={32} />}
          title="Sin pagos este mes"
          description={`Todavía no se ha registrado ninguna mensualidad de ${nombreMes}.`}
          action={
            <Button variant="light" onClick={onRegistrar} leftSection={<IconPlus size={16} />}>
              Registrar un pago
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" padding={0}>
      <Group justify="space-between" gap="sm" wrap="wrap" p="md">
        <TextInput
          aria-label="Buscar en los pagos del mes"
          placeholder="Buscar alumno o concepto"
          leftSection={<IconSearch size={16} />}
          value={busqueda}
          onChange={(e) => setBusqueda(e.currentTarget.value)}
          w={{ base: '100%', sm: 260 }}
        />
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {pagos.length} {pagos.length === 1 ? 'pago' : 'pagos'}
          </Text>
          <Badge variant="light" color="futcamedic" size="lg">
            {pesos(total)}
          </Badge>
        </Group>
      </Group>

      {filas.length === 0 ? (
        <Box pb="lg">
          <EmptyState
            title="Sin resultados"
            description={`Ningún pago coincide con "${busqueda.trim()}".`}
            action={
              <Button variant="light" onClick={() => setBusqueda('')}>
                Limpiar búsqueda
              </Button>
            }
          />
        </Box>
      ) : (
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Alumno
                </Text>
              </Table.Th>
              <Table.Th visibleFrom="sm">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Concepto
                </Text>
              </Table.Th>
              <Table.Th visibleFrom="md">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Fecha
                </Text>
              </Table.Th>
              <Table.Th ta="right">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Monto
                </Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filas.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {nombreDelPago(p)}
                  </Text>
                  <Text size="xs" c="dimmed" hiddenFrom="md">
                    {dayjs(p.payment_date).format('DD MMM YYYY')}
                  </Text>
                </Table.Td>
                <Table.Td visibleFrom="sm">
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {p.description || 'Mensualidad'}
                  </Text>
                </Table.Td>
                <Table.Td visibleFrom="md">
                  <Text size="sm" c="dimmed">
                    {dayjs(p.payment_date).format('DD MMM YYYY')}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text fw={600} size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pesos(p.amount)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}

function PanelNomina({
  nomina,
  cargando,
  mes,
  onRegistrar,
}: {
  nomina: any[];
  cargando: boolean;
  mes: number;
  onRegistrar: () => void;
}) {
  const total = nomina.reduce((suma, p) => suma + Number(p.amount || 0), 0);
  const nombreMes = dayjs().month(mes - 1).format('MMMM');

  if (cargando) {
    return (
      <Stack gap="xs">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={64} radius="md" />
        ))}
      </Stack>
    );
  }

  return (
    <Stack>
      <Card withBorder padding="md" radius="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm">
            <ThemeIcon size={40} radius="md" variant="light" color="grape">
              <IconWallet size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Nómina de {nombreMes}
              </Text>
              <Text fw={700} fz={24} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {pesos(total)}
              </Text>
            </Box>
          </Group>
          <Button variant="light" onClick={onRegistrar} leftSection={<IconPlus size={16} />}>
            Registrar pago a profesor
          </Button>
        </Group>
      </Card>

      {nomina.length === 0 ? (
        <Card withBorder radius="md" padding="xl">
          <EmptyState
            icon={<IconWallet size={32} />}
            title="Sin pagos a profesores"
            description={`Aún no se registra nómina de ${nombreMes}.`}
            action={
              <Button variant="light" onClick={onRegistrar} leftSection={<IconPlus size={16} />}>
                Registrar pago a profesor
              </Button>
            }
          />
        </Card>
      ) : (
        <Card withBorder radius="md" padding={0}>
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    Profesor
                  </Text>
                </Table.Th>
                <Table.Th visibleFrom="sm">
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    Concepto
                  </Text>
                </Table.Th>
                <Table.Th visibleFrom="md">
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    Fecha
                  </Text>
                </Table.Th>
                <Table.Th ta="right">
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    Monto
                  </Text>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {nomina.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {nombreDelPago(p)}
                    </Text>
                    <Text size="xs" c="dimmed" hiddenFrom="md">
                      {dayjs(p.payment_date).format('DD MMM YYYY')}
                    </Text>
                  </Table.Td>
                  <Table.Td visibleFrom="sm">
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {p.description || 'Nómina'}
                    </Text>
                  </Table.Td>
                  <Table.Td visibleFrom="md">
                    <Text size="sm" c="dimmed">
                      {dayjs(p.payment_date).format('DD MMM YYYY')}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fw={600} size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pesos(p.amount)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}

// ── Tendencia ─────────────────────────────────────────────────────────────

function TarjetaTendencia({
  tendencia,
  resumen,
  cargando,
  margenMes,
}: {
  tendencia: { etiqueta: string; cobrado: number; nomina: number; margen: number }[];
  resumen?: { totals: { collected: number; payroll: number; margin: number } };
  cargando: boolean;
  margenMes: number;
}) {
  const totales = resumen?.totals;
  const resumenTexto = tendencia
    .map((p) => `${p.etiqueta}: cobrado ${pesos(p.cobrado)}, nómina ${pesos(p.nomina)}`)
    .join('. ');

  return (
    <Card withBorder radius="md" padding="md" mt="md">
      <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap" mb="xs">
        <Box>
          <Text fw={600}>Últimos 6 meses</Text>
          <Text size="xs" c="dimmed">
            Mensualidades cobradas contra la nómina de profesores.
          </Text>
        </Box>
        <Group gap="xs">
          <Badge
            variant="light"
            color={margenMes >= 0 ? 'teal' : 'red'}
            size="lg"
            radius="sm"
          >
            Margen del mes {pesos(margenMes)}
          </Badge>
          {totales && (
            <Tooltip
              label={`Año: ${pesos(totales.collected)} cobrado · ${pesos(totales.payroll)} de nómina`}
              withArrow
            >
              <Badge variant="default" size="lg" radius="sm">
                {pesos(totales.collected)} en el año
              </Badge>
            </Tooltip>
          )}
        </Group>
      </Group>

      {cargando ? (
        <Skeleton height={220} radius="md" />
      ) : (
        <Box role="img" aria-label={`Cobrado y nómina por mes. ${resumenTexto}`}>
          <BarChart
            h={220}
            data={tendencia}
            dataKey="etiqueta"
            series={[
              { name: 'cobrado', color: 'futcamedic.6', label: 'Cobrado' },
              { name: 'nomina', color: 'orange.5', label: 'Nómina' },
            ]}
            withLegend
            withTooltip
            valueFormatter={(valor) => pesos(valor)}
            gridAxis="y"
            tickLine="y"
            barProps={{ radius: 4 }}
          />
        </Box>
      )}
    </Card>
  );
}

// ── Modal de registro ─────────────────────────────────────────────────────

function RegistrarPagoModal({
  opened,
  onClose,
  preseleccion,
  pendientes,
  mes,
}: {
  opened: boolean;
  onClose: () => void;
  preseleccion: Preseleccion;
  pendientes: PendienteDelMes[];
  mes: number;
}) {
  const [tipo, setTipo] = useState<'student' | 'teacher'>('student');
  const { data: students = [] } = useGetStudents();
  const { data: teachers = [] } = useGetTeachers();
  const studentMut = useRegisterStudentPayment();
  const teacherMut = useRegisterTeacherPayment();

  const form = useForm({
    initialValues: {
      person_id: '',
      amount: 0 as number | string,
      payment_date: new Date(),
      description: '',
      payment_month: String(mes),
    },
    validate: {
      person_id: (valor) => (valor ? null : 'Elige a quién se le registra el pago.'),
      amount: (valor) => (Number(valor) > 0 ? null : 'El monto debe ser mayor que cero.'),
      payment_date: (valor) => (valor ? null : 'Indica la fecha del pago.'),
    },
  });

  // Al abrir, la fila de cobranza manda: alumno, monto que debe y mes.
  useEffect(() => {
    if (!opened) return;
    setTipo(preseleccion?.tipo ?? 'student');
    form.setValues({
      person_id: preseleccion?.personId ?? '',
      amount: preseleccion?.amount ?? 0,
      payment_date: new Date(),
      description: preseleccion?.descripcion ?? '',
      payment_month: String(mes),
    });
    form.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, preseleccion, mes]);

  const elegido = pendientes.find((p) => p.id === form.values.person_id);
  const guardando = studentMut.isPending || teacherMut.isPending;

  const onSubmit = async (valores: typeof form.values) => {
    const fecha = dayjs(valores.payment_date).format('YYYY-MM-DD');
    try {
      if (tipo === 'student') {
        await studentMut.mutateAsync({
          student_id: valores.person_id,
          amount: Number(valores.amount),
          payment_date: fecha,
          description: valores.description || undefined,
          payment_month: Number(valores.payment_month) || mes,
        });
      } else {
        await teacherMut.mutateAsync({
          teacher_id: valores.person_id,
          amount: Number(valores.amount),
          payment_date: fecha,
          description: valores.description || undefined,
        });
      }
      notifications.show({
        color: 'green',
        title: 'Pago registrado',
        message: `Se registraron ${pesos(Number(valores.amount))}.`,
      });
      onClose();
    } catch (error: any) {
      notifications.show({
        color: 'red',
        title: 'No se pudo registrar el pago',
        message: error?.response?.data?.error || 'Revisa la conexión e inténtalo de nuevo.',
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Registrar pago" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <Select
            label="Tipo de pago"
            description="La mensualidad entra como ingreso; el profesor como nómina."
            data={[
              { value: 'student', label: 'Alumno' },
              { value: 'teacher', label: 'Profesor' },
            ]}
            value={tipo}
            allowDeselect={false}
            onChange={(valor) => {
              setTipo((valor as 'student' | 'teacher') || 'student');
              form.setFieldValue('person_id', '');
            }}
          />

          <Select
            label={tipo === 'student' ? 'Alumno' : 'Profesor'}
            placeholder={tipo === 'student' ? 'Busca por nombre' : 'Busca por nombre'}
            data={(tipo === 'student' ? students : teachers).map((p: any) => ({
              value: p.id,
              label: p.full_name,
            }))}
            searchable
            required
            {...form.getInputProps('person_id')}
            onChange={(valor) => {
              form.setFieldValue('person_id', valor || '');
              form.clearFieldError('person_id');
              const pendiente = pendientes.find((p) => p.id === valor);
              if (pendiente && !Number(form.values.amount)) {
                form.setFieldValue('amount', montoSugerido(pendiente));
              }
            }}
          />

          {elegido && (
            <Alert
              variant="light"
              color="orange"
              icon={<IconAlertTriangle size={16} />}
              p="xs"
            >
              <Text size="sm">
                Mensualidad {pesos(elegido.monthly_fee)} · debe {pesos(elegido.pending_amount)}
              </Text>
            </Alert>
          )}

          <NumberInput
            label="Monto"
            placeholder="0.00"
            leftSection="$"
            min={0}
            decimalScale={2}
            thousandSeparator=","
            required
            {...form.getInputProps('amount')}
          />

          <DateInput
            label="Fecha del pago"
            valueFormat="DD/MM/YYYY"
            required
            {...form.getInputProps('payment_date')}
          />

          {tipo === 'student' && (
            <Select
              label="Mes que se paga"
              description="Sirve para saber si la mensualidad del mes quedó cubierta."
              data={months}
              allowDeselect={false}
              {...form.getInputProps('payment_month')}
            />
          )}

          <TextInput
            label="Descripción"
            placeholder="Opcional: efectivo, transferencia…"
            {...form.getInputProps('description')}
          />

          <Button type="submit" loading={guardando} fullWidth mt="xs">
            Guardar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

// ── Padre ─────────────────────────────────────────────────────────────────

function ParentFinances() {
  const consulta = useSearchParams();
  const { data: children = [], isLoading: cargandoHijos } = useGetMyChildren();
  const [studentId, setStudentId] = useState<string | null>(() => consulta.get('student_id'));

  // Llegar desde Inicio con un hijo concreto, o con uno solo: no obligar a
  // elegir en un selector que no aporta nada.
  useEffect(() => {
    if (studentId) return;
    if (children.length > 0) setStudentId((children[0] as any).id);
  }, [children, studentId]);

  const {
    data: statement,
    isLoading: cargandoEstado,
    isError: errorEstado,
    refetch: recargarEstado,
  } = useGetAccountStatement(
    studentId || undefined,
  );
  const { data: pagos = [], isLoading: cargandoPagos } = useGetPaymentsByStudent(
    studentId || undefined,
  );

  const hijo = (children as any[]).find((c) => c.id === studentId);
  const nombreMes = dayjs().format('MMMM');
  const pagadoEsteMes = statement
    ? Math.max(0, Number(statement.monthlyFee) - Number(statement.pendingAmount))
    : 0;
  const progreso =
    statement && Number(statement.monthlyFee) > 0
      ? Math.min(100, Math.round((pagadoEsteMes / Number(statement.monthlyFee)) * 100))
      : 0;

  return (
    <>
      {/* «Pagos», igual que en la navegación: un padre no administra las
          finanzas de la academia, consulta sus mensualidades. */}
      <PageHeader title="Pagos" description="Lo que debes y lo que ya pagaste" />

      {cargandoHijos ? (
        <Skeleton height={180} radius="md" />
      ) : children.length === 0 ? (
        <Card withBorder radius="md" padding="xl">
          <EmptyState
            icon={<IconUser size={32} />}
            title="Sin alumnos registrados"
            description="Cuando la academia registre a tu hijo, aquí verás sus mensualidades."
          />
        </Card>
      ) : (
        <>
          {children.length > 1 && (
            <Card withBorder padding="md" radius="md" mb="md">
              <Select
                label="Hijo/a"
                placeholder="Elige a quién consultar"
                data={(children as any[]).map((c) => ({ value: c.id, label: c.full_name }))}
                value={studentId}
                onChange={setStudentId}
                allowDeselect={false}
                w={{ base: '100%', sm: 320 }}
              />
            </Card>
          )}

          {errorEstado ? (
            /* Antes un fallo devolvía `null` y la tarjeta simplemente no se
               dibujaba: el padre veía la pantalla a medias sin saber por qué. */
            <ErrorState
              title="No pudimos cargar el estado de cuenta"
              onRetry={() => recargarEstado()}
            />
          ) : cargandoEstado && !statement ? (
            <Skeleton height={180} radius="md" mb="md" />
          ) : statement ? (
            <Card withBorder padding="lg" radius="md" mb="md">
              <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
                <Box>
                  <Text fw={600} fz="lg">
                    {statement.studentName || hijo?.full_name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {statement.category || 'Sin categoría'}
                  </Text>
                </Box>
                <Badge
                  color={statement.hasPaidThisMonth ? 'green' : 'orange'}
                  variant="light"
                  size="lg"
                  leftSection={
                    statement.hasPaidThisMonth ? (
                      <IconCircleCheck size={14} />
                    ) : (
                      <IconAlertTriangle size={14} />
                    )
                  }
                >
                  {statement.hasPaidThisMonth ? 'Al día' : 'Pendiente'}
                </Badge>
              </Group>

              {/*
                El adeudo es lo único que un padre viene a mirar, así que va
                primero y grande. Antes los tres bloques competían en un
                `SimpleGrid cols={{ base: 1, xs: 3 }}` que en 375 px los apilaba
                del mismo tamaño, con la etiqueta a 12 px en mayúsculas.
              */}
              <Box mb="md">
                <Text size="sm" c="dimmed" fw={600}>
                  {Number(statement.pendingAmount) > 0 ? 'Debes' : 'No debes nada'}
                </Text>
                <Text
                  fw={700}
                  fz={40}
                  lh={1.1}
                  c={Number(statement.pendingAmount) > 0 ? 'orange.8' : 'teal.7'}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {pesos(statement.pendingAmount)}
                </Text>
              </Box>

              <SimpleGrid cols={2} spacing="md">
                <Box>
                  <Text size="sm" c="dimmed">
                    Cuota mensual
                  </Text>
                  <Text fw={600} fz="lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pesos(statement.monthlyFee)}
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed">
                    Pagado este mes
                  </Text>
                  <Text fw={600} fz="lg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pesos(pagadoEsteMes)}
                  </Text>
                </Box>
              </SimpleGrid>

              <Progress
                value={progreso}
                mt="md"
                size="md"
                radius="xl"
                color={statement.hasPaidThisMonth ? 'teal' : 'orange'}
                aria-label={`Mensualidad cubierta al ${progreso}%`}
              />

              <Group justify="space-between" mt="xs" gap="xs" wrap="wrap">
                <Text size="xs" c="dimmed">
                  {statement.dueDate
                    ? `Vence el ${dayjs(statement.dueDate).format('D [de] MMMM')}`
                    : 'Sin fecha de vencimiento'}
                </Text>
                <Text size="xs" c="dimmed">
                  {Number(statement.totalPayments) || 0} movimientos ·{' '}
                  {pesos(statement.totalPaid)} pagado en total
                </Text>
              </Group>

              {!statement.hasPaidThisMonth && (
                <Alert
                  variant="light"
                  color="orange"
                  icon={<IconAlertTriangle size={16} />}
                  mt="md"
                  title={`Mensualidad de ${nombreMes} pendiente`}
                >
                  <Text size="sm">
                    Falta cubrir {pesos(statement.pendingAmount)}. El pago se registra en la
                    academia y aparecerá aquí en cuanto el staff lo capture.
                  </Text>
                </Alert>
              )}
            </Card>
          ) : null}

          <Card withBorder radius="md" padding={0}>
            <Group justify="space-between" p="md" gap="sm" wrap="wrap">
              <Box>
                <Text fw={600}>Movimientos</Text>
                <Text size="sm" c="dimmed">
                  Historial de mensualidades de {hijo?.full_name || 'tu hijo/a'}.
                </Text>
              </Box>
              <Badge variant="light" color="futcamedic" size="lg">
                {pagos.length} {pagos.length === 1 ? 'movimiento' : 'movimientos'}
              </Badge>
            </Group>

            {cargandoPagos ? (
              <Box p="md" pt={0}>
                <Skeleton height={120} radius="md" />
              </Box>
            ) : pagos.length === 0 ? (
              <Box pb="lg">
                <EmptyState
                  icon={<IconCash size={32} />}
                  title="Sin movimientos"
                  description="Aquí verás cada mensualidad que se registre."
                />
              </Box>
            ) : (
              <>
                {/* En teléfono, filas tocables: la tabla obligaba a repetir el
                    concepto bajo la fecha para que entrara en 375 px. */}
                <Box hiddenFrom="sm" p="md" pt={0}>
                  <Stack gap="xs">
                    {pagos.map((p: any, i: number) => (
                      <TouchRow
                        key={p.id || i}
                        leading={
                          <ThemeIcon size={40} radius="xl" variant="light" color="teal">
                            <IconCash size={20} />
                          </ThemeIcon>
                        }
                        title={pesos(p.amount)}
                        subtitle={`${dayjs(p.payment_date).format('D [de] MMMM YYYY')} · ${
                          p.description || 'Mensualidad'
                        }`}
                        withChevron={false}
                      />
                    ))}
                  </Stack>
                </Box>

                <Box visibleFrom="sm">
                  <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>
                          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                            Fecha
                          </Text>
                        </Table.Th>
                        <Table.Th>
                          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                            Concepto
                          </Text>
                        </Table.Th>
                        <Table.Th ta="right">
                          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                            Monto
                          </Text>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pagos.map((p: any, i: number) => (
                        <Table.Tr key={p.id || i}>
                          <Table.Td>
                            <Text size="sm">{dayjs(p.payment_date).format('DD MMM YYYY')}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {p.description || 'Mensualidad'}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text fw={600} size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {pesos(p.amount)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}
