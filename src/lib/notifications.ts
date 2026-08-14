import { PediatricNotification, Patient, VaccineRecord, Consultation, NotificationPreferences } from '../types/ppueri';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  vaccineAlerts: true,
  criticalLabAlerts: true,
  appointmentReminders: true,
  newCarePlanAlerts: true,
  pushEnabled: true,
  emailEnabled: true,
  smsWhatsAppEnabled: true,
};

export function generateInitialNotifications(
  patients: Patient[],
  vaccinesMap: Record<string, VaccineRecord[]>,
  consultations: Consultation[]
): PediatricNotification[] {
  const notifications: PediatricNotification[] = [];

  // 1. Notificações de Vacinas para Pacientes e Médicos
  patients.forEach((patient) => {
    const patientVaccines = vaccinesMap[patient.id] || [];
    const delayedVaccines = patientVaccines.filter((v) => v.status === 'atrasada');
    const upcomingVaccines = patientVaccines.filter((v) => v.status === 'proxima');

    delayedVaccines.forEach((v) => {
      notifications.push({
        id: `notif_vac_del_${patient.id}_${v.vaccineId}`,
        patientId: patient.id,
        patientName: patient.name,
        title: `Vacina Atrasada: ${v.vaccineName}`,
        message: `${patient.name} está com a dose ${v.doseNumber} (${v.targetDisease}) pendente na Caderneta de Vacinação.`,
        category: 'vacina',
        targetRole: 'ambos',
        priority: 'alta',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 horas atrás
        isRead: false,
        actionLink: 'vacinas',
        actionLabel: 'Ver Caderneta',
      });
    });

    upcomingVaccines.forEach((v) => {
      notifications.push({
        id: `notif_vac_up_${patient.id}_${v.vaccineId}`,
        patientId: patient.id,
        patientName: patient.name,
        title: `Vacina Próxima: ${v.vaccineName}`,
        message: `Dose recomendada para os próximos dias (${v.targetAgeBracket}). Prepare o cartão de vacinas.`,
        category: 'vacina',
        targetRole: 'paciente',
        priority: 'media',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        isRead: false,
        actionLink: 'vacinas',
        actionLabel: 'Ver Agendamento',
      });
    });
  });

  // 2. Notificações de Exames Críticos e Consultas para Médicos
  consultations.forEach((cons) => {
    const patient = patients.find((p) => p.id === cons.patientId);
    const pName = patient ? patient.name : 'Paciente';

    // Checar exames alterados
    cons.exams.forEach((exam) => {
      const alteredItems = exam.items.filter((item) => item.status !== 'normal');
      if (alteredItems.length > 0) {
        notifications.push({
          id: `notif_exam_${exam.id}`,
          patientId: cons.patientId,
          patientName: pName,
          title: `Resultado de Exame Alterado: ${exam.title}`,
          message: `${alteredItems.length} parâmetro(s) fora da faixa de referência para ${pName} (${alteredItems.map((i) => i.parameter).join(', ')}).`,
          category: 'exame',
          targetRole: 'medico',
          priority: 'alta',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 dia atrás
          isRead: false,
          actionLink: 'exames',
          actionLabel: 'Analisar Exame',
        });
      }
    });

    // Sinais vitais alterados
    const alteredVitals = cons.vitalsEvaluations.filter((v) => v.status === 'alterado');
    if (alteredVitals.length > 0) {
      notifications.push({
        id: `notif_vitals_${cons.id}`,
        patientId: cons.patientId,
        patientName: pName,
        title: `Alerta Clínico de Sinais Vitais: ${pName}`,
        message: `Parâmetro alterado detectado durante a consulta: ${alteredVitals.map((v) => `${v.parameterName} (${v.value} ${v.unit})`).join(', ')}.`,
        category: 'alerta_clinico',
        targetRole: 'medico',
        priority: 'alta',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        isRead: false,
        actionLink: 'vitals',
        actionLabel: 'Abrir Prontuário',
      });
    }

    // Plano de cuidados atualizado para os pais
    if (cons.carePlan) {
      notifications.push({
        id: `notif_care_${cons.id}`,
        patientId: cons.patientId,
        patientName: pName,
        title: `Novo Plano de Cuidados Pediátricos Disponível`,
        message: `Dra. Beatriz Albuquerque atualizou as orientações, prescrições e orientações alimentares para ${pName}.`,
        category: 'orientacao',
        targetRole: 'paciente',
        priority: 'media',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        isRead: true,
        actionLink: 'plano',
        actionLabel: 'Ver Orientações',
      });
    }
  });

  // Notificação Informativa LGPD / Sistema
  notifications.push({
    id: 'notif_sys_lgpd',
    title: 'Segurança & Criptografia Ativa',
    message: 'Seu prontuário eletrônico está protegido por criptografia de ponta a ponta em estrita conformidade com a LGPD e HIPAA.',
    category: 'orientacao',
    targetRole: 'ambos',
    priority: 'baixa',
    timestamp: new Date().toISOString(),
    isRead: false,
  });

  return notifications;
}
