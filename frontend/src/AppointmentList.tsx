import { useEffect, useState } from "react";
import { Link, useParams, type Params } from "react-router";
import { getDayOfWeekString, getMonthString, getDayOfWeek, type Date, dateToString } from "./dates";
import { type JSX } from "react";
import { isRecord } from "./types";

type Appointment = { appointment_id: number; date: string; hour_24: number; capacity: number; slots_booked: number };

function AppointmentList() {
  const params = useParams();
  const date = getDateFromParams(params);
  const date_formatted = formatDateForAppointment(date);

  const initial_appointments: Appointment[] = [];
  const [appointments, setAppointments] = useState(initial_appointments);

  useEffect(() => {
    const url = `/api/book/get_available_appointments?date=${encodeURIComponent(dateToString(date))}`;
    fetch(url).then(doGetAvailableAppointmentsResp).catch(doGetAvailableAppointmentsError);
  }, [params]);

  function doGetAvailableAppointmentsResp(res: Response): void {
    if (res.status === 200) {
      const p = res.json();
      p.then(doGetAvailableAppointmentsJson);
      p.catch((ex) => doGetAvailableAppointmentsError("200 response is not JSON", ex));
    } else if (res.status === 400) {
      const p = res.text();
      p.then(doGetAvailableAppointmentsError);
      p.catch((ex) => doGetAvailableAppointmentsError("400 response is not text", ex));
    } else {
      doGetAvailableAppointmentsError(`Bad status code: ${res.status}`);
    }
  }

  function doGetAvailableAppointmentsJson(data: unknown): void {
    if (!isRecord(data)) {
      throw new Error(`data is not a record: ${typeof data}`);
    }
    if (typeof data.success !== "boolean") {
      throw new Error(`data.success is not a boolean: ${typeof data.success}`);
    }
    if (!data.success) {
      // TODO more robust error handling
      throw new Error(`data.success is not true: ${data.success}`);
    }
    if (!Array.isArray(data.appointments)) {
      throw new Error(`data.appointments is not an array: ${typeof data.appointments}`);
    }

    const retrieved_appointments: Appointment[] = [];
    for (const appointment of data.appointments) {
      if (!isRecord(appointment)) {
        throw new Error(`appointment is not a record: ${typeof appointment}`);
      }
      if (typeof appointment.appointment_id !== "number") {
        throw new Error(`appointment.appointment_id is not a number: ${typeof appointment.appointment_id}`);
      }
      if (typeof appointment.date !== "string") {
        throw new Error(`appointment.date is not a string: ${typeof appointment.date}`);
      }
      if (typeof appointment.hour_24 !== "number") {
        throw new Error(`appointment.hour_24 is not a number: ${typeof appointment.hour_24}`);
      }
      if (typeof appointment.capacity !== "number") {
        throw new Error(`appointment.capacity is not a number: ${typeof appointment.capacity}`);
      }
      if (typeof appointment.slots_booked !== "number") {
        throw new Error(`appointment.slots_booked is not a number: ${typeof appointment.slots_booked}`);
      }

      retrieved_appointments.push({
        appointment_id: appointment.appointment_id,
        date: appointment.date,
        hour_24: appointment.hour_24,
        capacity: appointment.capacity,
        slots_booked: appointment.slots_booked,
      });
    }

    setAppointments(retrieved_appointments);
  }

  function doGetAvailableAppointmentsError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/book/get_available_appointments failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <div>
      <h2>{date_formatted}</h2>
      {renderAppointmentBookingLinks(appointments)}
    </div>
  );
}

const getDateFromParams = (params: Readonly<Params<string>>): Date => {
  const year_month_day = params.date;
  if (year_month_day === undefined) {
    throw new Error("Something went wrong getting the date in BookDate!");
  }

  const [year_str, month_str, day_str] = year_month_day.split("-");
  const date = {
    day: parseInt(day_str),
    month: parseInt(month_str),
    year: parseInt(year_str),
  };

  return date;
};

/**
 * Formats a date like the following: {day-of-week-string}, {month-string} {day}, {year}. For example, the date
 * {day: 10, month: 7, year: 2025} would be formatted as "Thursday, July 10, 2025".
 *
 * @param date Date to be formatted.
 * @returns Formatted date with day of week, month, day, and year.
 */
const formatDateForAppointment = (date: Date) => {
  const day_of_week_str = getDayOfWeekString(getDayOfWeek(date));

  const month_str = getMonthString(date.month);

  const date_str = `${day_of_week_str}, ${month_str} ${date.day}, ${date.year}`;

  return date_str;
};

const renderAppointmentBookingLinks = (appointments: Appointment[]): JSX.Element => {
  const links: JSX.Element[] = [];
  for (const appointment of appointments) {
    const hour_24 = appointment.hour_24;
    const hour_formatted = formatHour24ToHour12(hour_24);

    links.push(
      <Link
        key={appointment.appointment_id}
        to={{
          pathname: "/confirm_booking",
          search: `appointment_id=${encodeURIComponent(appointment.appointment_id)}`,
        }}
      >
        {hour_formatted}
      </Link>
    );
  }

  return <div>{links}</div>;
};

/**
 * Formats 24-hour time into 12-hour time. For example, formats 13 to 1:00 pm, and formats 5 to 5:00 am.
 *
 * @param hour_24 The time in 24-hour time
 * @returns The time in 12-hour time, formatted
 */
const formatHour24ToHour12 = (hour_24: number): string => {
  if (hour_24 < 13) {
    return hour_24 + ":00 am";
  } else {
    return hour_24 - 12 + ":00 pm";
  }
};

export default AppointmentList;
