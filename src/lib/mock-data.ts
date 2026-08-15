import { Patient, Consultation, VaccineRecord, Appointment } from '../types/ppueri';
import { OFFICIAL_VACCS_SCHEDULE } from './pediatric-rules';

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_CONSULTATIONS: Consultation[] = [];

// Gera calendário vacinal inicial limpo (sem dados fictícios de aplicação)
export function getInitialVaccinesForPatient(patientId: string, ageInMonths: number): VaccineRecord[] {
  return OFFICIAL_VACCS_SCHEDULE.map((vacc) => {
    let status: VaccineRecord['status'] = 'pendente';

    if (ageInMonths > vacc.ageMonthsRecommended + 2) {
      status = 'atrasada';
    } else if (ageInMonths >= vacc.ageMonthsRecommended || vacc.ageMonthsRecommended - ageInMonths <= 2) {
      status = 'proxima';
    } else {
      status = 'pendente';
    }

    return {
      ...vacc,
      id: `vac_${patientId}_${vacc.vaccineId}`,
      patientId,
      status,
    };
  });
}

export const INITIAL_APPOINTMENTS: Appointment[] = [];

