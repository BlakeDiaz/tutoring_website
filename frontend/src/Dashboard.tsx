import { useEffect, useState, type JSX } from "react";
import { getCookie } from "./cookies";
import { createRedirectSearchParams } from "./redirects";
import { useNavigate } from "react-router";
import { isRecord } from "./types";
import { type Appointment, parseAppointments } from "./appointments";
import { parseDate, formatDateForAppointment, formatHour24ToHour12 } from "./dates";
import SiteNavbar from "./SiteNavbar";

function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/book/get_scheduled_appointments", {
      method: "GET",
      headers: {
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
    })
      .then(doGetScheduledAppointmentsResp)
      .catch(doGetScheduledAppointmentsError);
  }, []);

  function doGetScheduledAppointmentsResp(res: Response) {
    if (res.status === 200) {
      const p = res.json();
      p.then(doGetScheduledAppointmentsJson);
      p.catch((ex) => doGetScheduledAppointmentsError("200 response is not JSON", ex));
    } else if (res.status === 400) {
      const p = res.text();
      p.then(doGetScheduledAppointmentsError);
      p.catch((ex) => doGetScheduledAppointmentsError("400 response is not text", ex));
    } else if (res.status === 401) {
      // User is not logged in
      const redirect_search_params = createRedirectSearchParams("/dashboard");
      navigate(`/login?${redirect_search_params.toString()}`);
    } else {
      doGetScheduledAppointmentsError(`Bad status code: ${res.status}`);
    }
  }

  function doGetScheduledAppointmentsJson(data: unknown) {
    if (!isRecord(data)) {
      throw new Error(`data is not a record: ${typeof data}`);
    }
    if (!Array.isArray(data.appointments)) {
      throw new Error(`data.appointments is not an array: ${typeof data.appointments}`);
    }

    // TODO more robust error handling
    const retrieved_appointments = parseAppointments(data.appointments);
    setAppointments(retrieved_appointments);
  }

  function doGetScheduledAppointmentsError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/book/get_scheduled_appointments failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <>
      <SiteNavbar />
      <h2>Your Appointments</h2>
      {renderAppointments(appointments)}
    </>
  );
}

const renderAppointments = (appointments: Appointment[]): JSX.Element => {
  const links: JSX.Element[] = [];
  for (const appointment of appointments) {
    const hour_24 = appointment.hour_24;
    const date_formatted = formatDateForAppointment(parseDate(appointment.date));
    const hour_formatted = formatHour24ToHour12(hour_24);

    links.push(
      <li key={appointment.appointment_id}>
        <p>
          {date_formatted} {hour_formatted} - {appointment.slots_booked}/{appointment.capacity} slots filled
        </p>
      </li>
    );
  }

  return <ul>{links}</ul>;
};

export default Dashboard;
