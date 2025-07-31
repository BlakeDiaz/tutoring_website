import { isRecord } from "./types";
import { parseDate, compareDates } from "./dates";

export type Appointment = {
  appointment_id: number;
  date: string;
  hour_24: number;
  capacity: number;
  slots_booked: number;
  leader_name: string;
};

export const parseAppointment = (data: unknown): Appointment => {
  if (!isRecord(data)) {
    throw new Error(`data is not a record: ${typeof data}`);
  }
  if (typeof data.appointment_id !== "number") {
    throw new Error(`data.appointment_id is not a number: ${typeof data.appointment_id}`);
  }
  if (typeof data.date !== "string") {
    throw new Error(`data.date is not a string: ${typeof data.date}`);
  }
  if (typeof data.hour_24 !== "number") {
    throw new Error(`data.hour_24 is not a number: ${typeof data.hour_24}`);
  }
  if (typeof data.capacity !== "number") {
    throw new Error(`data.capacity is not a number: ${typeof data.capacity}`);
  }
  if (typeof data.slots_booked !== "number") {
    throw new Error(`data.slots_booked is not a number: ${typeof data.slots_booked}`);
  }
  if (typeof data.leader_name !== "string") {
    throw new Error(`data.leader_name is not a string: ${typeof data.leader_name}`);
  }

  return {
    appointment_id: data.appointment_id,
    date: data.date,
    hour_24: data.hour_24,
    capacity: data.capacity,
    slots_booked: data.slots_booked,
    leader_name: data.leader_name,
  };
};

export const parseAppointments = (data: unknown): Appointment[] => {
  if (!Array.isArray(data)) {
    throw new Error(`data is not an array: ${typeof data}`);
  }

  const appointments: Appointment[] = [];
  for (const appointment of data) {
    appointments.push(parseAppointment(appointment));
  }

  return appointments;
};

export const compareAppointments = (a: Appointment, b: Appointment): number => {
  const date_comparison = compareDates(parseDate(a.date), parseDate(b.date));
  if (date_comparison !== 0) {
    return date_comparison;
  }

  return a.hour_24 - b.hour_24;
};
