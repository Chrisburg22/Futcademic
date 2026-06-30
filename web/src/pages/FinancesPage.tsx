import { useState } from 'react';
import {
  Card,
  Group,
  Select,
  Button,
  Text,
  Badge,
  Stack,
  NumberInput,
  TextInput,
  Modal,
  Tabs,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import {
  useGetPayments,
  useGetPendingPayments,
  useGetPaymentsByStudent,
  useGetAccountStatement,
  useRegisterStudentPayment,
  useRegisterTeacherPayment,
} from '../hooks/usePayments';
import { useGetStudents, useGetMyChildren } from '../hooks/useStudents';
import { useGetTeachers } from '../hooks/useUsers';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

const months = Array.from({ length: 12 }).map((_, i) => ({
  value: String(i + 1),
  label: dayjs().month(i).format('MMMM'),
}));

export function FinancesPage() {
  const { profile } = useAuth();
  if (profile?.role === 'padre') return <ParentFinances />;
  return <AdminFinances />;
}

function AdminFinances() {
  const [month, setMonth] = useState<string | null>(String(new Date().getMonth() + 1));
  const [tab, setTab] = useState<string | null>('students');
  const [opened, { open, close }] = useDisclosure(false);

  const filters = month
    ? { type: tab === 'teachers' ? ('pago_profesor' as const) : ('mensualidad' as const), month: Number(month) }
    : undefined;
  const { data: payments = [], isLoading } = useGetPayments(filters);
  const { data: pending = [] } = useGetPendingPayments(month ? Number(month) : undefined);

  return (
    <>
      <PageHeader
        title="Finanzas"
        description="Pagos de alumnos y profesores"
        actions={<Button onClick={open}>Registrar pago</Button>}
      />
      <Card withBorder padding="md" radius="md" mb="md">
        <Group>
          <Select label="Mes" data={months} value={month} onChange={setMonth} w={200} />
        </Group>
      </Card>
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="students">Alumnos</Tabs.Tab>
          <Tabs.Tab value="teachers">Profesores</Tabs.Tab>
          <Tabs.Tab value="pending">Pendientes</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="students" pt="md">
          {isLoading ? (
            <LoadingState />
          ) : payments.length === 0 ? (
            <EmptyState description="Sin pagos registrados este mes." />
          ) : (
            <PaymentList items={payments} />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="teachers" pt="md">
          {isLoading ? (
            <LoadingState />
          ) : payments.length === 0 ? (
            <EmptyState description="Sin pagos a profesores este mes." />
          ) : (
            <PaymentList items={payments} />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="pending" pt="md">
          {pending.length === 0 ? (
            <EmptyState description="Todos los pagos están al día." />
          ) : (
            <Stack>
              {pending.map((p: any) => (
                <Card key={p.student_id} withBorder padding="md" radius="md">
                  <Group justify="space-between">
                    <Text fw={500}>{p.full_name}</Text>
                    <Badge color="orange">Adeuda mes {p.month}</Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
      <RegisterPaymentModal opened={opened} onClose={close} />
    </>
  );
}

function PaymentList({ items }: { items: any[] }) {
  return (
    <Stack>
      {items.map((p) => (
        <Card key={p.id} withBorder padding="md" radius="md">
          <Group justify="space-between">
            <div>
              <Text fw={500}>
                {p.student?.full_name || p.teacher?.full_name || 'Pago'}
              </Text>
              <Text size="xs" c="dimmed">
                {dayjs(p.payment_date).format('DD MMM YYYY')} · {p.description || ''}
              </Text>
            </div>
            <Text fw={700}>${p.amount}</Text>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

function RegisterPaymentModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [type, setType] = useState<'student' | 'teacher'>('student');
  const { data: students = [] } = useGetStudents();
  const { data: teachers = [] } = useGetTeachers();
  const studentMut = useRegisterStudentPayment();
  const teacherMut = useRegisterTeacherPayment();

  const form = useForm({
    initialValues: {
      person_id: '',
      amount: 0,
      payment_date: new Date(),
      description: '',
      payment_month: String(new Date().getMonth() + 1),
    },
  });

  const onSubmit = async (v: typeof form.values) => {
    const date = dayjs(v.payment_date).format('YYYY-MM-DD');
    if (type === 'student') {
      await studentMut.mutateAsync({
        student_id: v.person_id,
        amount: v.amount,
        payment_date: date,
        description: v.description,
        payment_month: Number(v.payment_month),
      });
    } else {
      await teacherMut.mutateAsync({
        teacher_id: v.person_id,
        amount: v.amount,
        payment_date: date,
        description: v.description,
      });
    }
    notifications.show({ color: 'green', message: 'Pago registrado' });
    onClose();
    form.reset();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Registrar pago" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <Select
            label="Tipo"
            value={type}
            onChange={(v) => setType((v as any) || 'student')}
            data={[
              { value: 'student', label: 'Alumno' },
              { value: 'teacher', label: 'Profesor' },
            ]}
          />
          <Select
            label={type === 'student' ? 'Alumno' : 'Profesor'}
            data={(type === 'student' ? students : teachers).map((p: any) => ({
              value: p.id,
              label: p.full_name,
            }))}
            searchable
            required
            {...form.getInputProps('person_id')}
          />
          <NumberInput label="Monto" required {...form.getInputProps('amount')} />
          <DateInput
            label="Fecha"
            required
            {...form.getInputProps('payment_date')}
          />
          <TextInput label="Descripción" {...form.getInputProps('description')} />
          {type === 'student' && (
            <Select
              label="Mes correspondiente"
              data={months}
              {...form.getInputProps('payment_month')}
            />
          )}
          <Button
            type="submit"
            loading={studentMut.isPending || teacherMut.isPending}
          >
            Guardar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

function ParentFinances() {
  const { data: children = [] } = useGetMyChildren();
  const [studentId, setStudentId] = useState<string | null>(null);
  const { data: statement } = useGetAccountStatement(studentId || undefined);
  const { data: payments = [], isLoading } = useGetPaymentsByStudent(studentId || undefined);

  return (
    <>
      <PageHeader title="Finanzas" description="Estado de cuenta de tus hijos" />
      <Card withBorder padding="md" radius="md" mb="md">
        <Select
          label="Hijo/a"
          value={studentId}
          onChange={setStudentId}
          data={children.map((c: any) => ({ value: c.id, label: c.full_name }))}
        />
      </Card>
      {!studentId ? (
        <EmptyState description="Selecciona un hijo/a." />
      ) : (
        <>
          {statement && (
            <Card withBorder padding="lg" radius="md" mb="md">
              <Group justify="space-between" mb="xs">
                <Text fw={600}>Estado de cuenta</Text>
                <Badge
                  color={statement.hasPaidThisMonth ? 'green' : 'orange'}
                  variant="light"
                  size="lg"
                >
                  {statement.hasPaidThisMonth ? 'Al día' : 'Pendiente'}
                </Badge>
              </Group>
              <Group grow>
                <div>
                  <Text size="xs" c="dimmed">Cuota mensual</Text>
                  <Text fw={700}>${statement.monthlyFee}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Adeudo</Text>
                  <Text fw={700} c={statement.pendingAmount > 0 ? 'red' : undefined}>
                    ${statement.pendingAmount}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Total pagado</Text>
                  <Text fw={700}>${statement.totalPayments}</Text>
                </div>
              </Group>
            </Card>
          )}
          {isLoading ? (
            <LoadingState />
          ) : payments.length === 0 ? (
            <EmptyState description="Sin movimientos registrados." />
          ) : (
            <PaymentList items={payments} />
          )}
        </>
      )}
    </>
  );
}
