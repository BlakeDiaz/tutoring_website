import { parseAppointment, type Appointment } from "./appointments";
import { parseDashboardAppointment, type DashboardAppointment } from "./dashboard_appointments";

export type AdminAppointment = Appointment | DashboardAppointment;

export const parseAdminAppointment = (data: unknown): AdminAppointment => {
  const appointment = parseAppointment(data);
  if (appointment.slots_booked === 0) {
    return appointment;
  }

  return parseDashboardAppointment(data);
};

export const parseAdminAppointments = (data: unknown): AdminAppointment[] => {
  if (!Array.isArray(data)) {
    throw new Error(`data is not an array: ${typeof data}`);
  }

  const admin_appointments: AdminAppointment[] = [];
  for (const admin_appointment of data) {
    admin_appointments.push(parseAdminAppointment(admin_appointment));
  }

  return admin_appointments;
};
