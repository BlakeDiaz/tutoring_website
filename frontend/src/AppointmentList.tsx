import { useEffect, useState } from "react";
import { Link, useParams, type Params } from "react-router";
import { type Date, dateToString, parseDate, formatHour24ToHour12 } from "./dates";
import { type JSX } from "react";
import { isRecord } from "./types";
import { parseAppointments, type Appointment } from "./appointments";
import { formatDateForAppointment } from "./dates";

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

    const retrieved_appointments = parseAppointments(data.appointments);
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

  return parseDate(year_month_day);
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

export default AppointmentList;
