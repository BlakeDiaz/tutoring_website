import { parseAppointment, type Appointment } from "./appointments";
import { parseBookings, type Booking } from "./bookings";
import { isRecord } from "./types";

export type DashboardAppointment = Appointment & {
  leader_name: string;
  subject: string;
  location: string;
  confirmation_code: string;
  bookings: Booking[];
};

export const parseDashboardAppointment = (data: unknown): DashboardAppointment => {
  const appointment = parseAppointment(data);
  if (!isRecord(data)) {
    throw new Error(`data is not a record: ${typeof data}`);
  }
  if (typeof data.leader_name !== "string") {
    throw new Error(`data.leader_name is not a string: ${typeof data.leader_name}`);
  }
  if (typeof data.subject !== "string") {
    throw new Error(`data.subject is not a string: ${typeof data.subject}`);
  }
  if (typeof data.location !== "string") {
    throw new Error(`data.location is not a string: ${typeof data.location}`);
  }
  if (typeof data.confirmation_code !== "string") {
    throw new Error(`data.confirmation_code is not a string: ${typeof data.confirmation_code}`);
  }
  const bookings = parseBookings(data.bookings);

  return {
    appointment_id: appointment.appointment_id,
    date: appointment.date,
    hour_24: appointment.hour_24,
    capacity: appointment.capacity,
    slots_booked: appointment.slots_booked,
    leader_name: data.leader_name,
    subject: data.subject,
    location: data.location,
    confirmation_code: data.confirmation_code,
    bookings: bookings,
  };
};

export const parseDashboardAppointments = (data: unknown): DashboardAppointment[] => {
  if (!Array.isArray(data)) {
    throw new Error(`data is not an array: ${typeof data}`);
  }

  const dashboard_appointments: DashboardAppointment[] = [];
  for (const dashboard_appointment of data) {
    dashboard_appointments.push(parseDashboardAppointment(dashboard_appointment));
  }

  return dashboard_appointments;
};
