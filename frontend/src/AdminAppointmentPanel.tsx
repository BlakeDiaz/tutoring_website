import { useEffect, useState, type JSX } from "react";
import { getCookie } from "./cookies";
import { useNavigate } from "react-router";
import { parseAdminAppointments, type AdminAppointment } from "./admin_appointments";
import { isRecord } from "./types";
import {
  dateToString,
  formatDateForAppointment,
  formatHour24ToHour12,
  getDate,
  getFirstDateOfMonth,
  getLastDateOfMonth,
  parseDate,
} from "./dates";
import AdminNavbar from "./AdminNavbar";

function AdminAppointmentPanel() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [removedID, setRemoveledID] = useState<number>();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/is_admin", {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
    })
      .then(doIsAdminResp)
      .catch(doIsAdminError);

    const today = getDate();
    const start_date = getFirstDateOfMonth(today.month, today.year);
    const end_date = getLastDateOfMonth(today.month, today.year);
    const params = new URLSearchParams();
    params.set("start_date", dateToString(start_date));
    params.set("end_date", dateToString(end_date));
    fetch("/api/admin/get_all_appointments?" + params.toString(), {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
    })
      .then(doGetAllAppointmentsResp)
      .catch(doGetAllAppointmentsError);
  }, []);

  function doIsAdminResp(res: Response) {
    if (res.status === 200) {
      return;
    } else if (res.status === 401) {
      navigate("/");
    } else {
      doIsAdminError(`Bad status code: ${res.status}`);
      navigate("/");
    }
  }

  function doIsAdminError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/admin/is_admin failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function doGetAllAppointmentsResp(res: Response) {
    if (res.status === 200) {
      const p = res.json();
      p.then(doGetAllAppointmentsJson);
      p.catch((ex) => doGetAllAppointmentsError("200 response is not JSON", ex));
    } else if (res.status === 401) {
      navigate("/");
    } else {
      doGetAllAppointmentsError(`Bad status code: ${res.status}`);
      navigate("/");
    }
  }

  function doGetAllAppointmentsJson(data: unknown) {
    if (!isRecord(data)) {
      throw new Error(`data is not a record: ${typeof data}`);
    }

    const retrieved_appointments = parseAdminAppointments(data.appointments);
    setAppointments(retrieved_appointments);
    setLoaded(true);
  }

  function doGetAllAppointmentsError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/admin/get_all_appointments failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function doRemoveAppointment(appointment_id: number) {
    if (!window.confirm("Are you sure that you want to remove this appointment time slot?")) {
      return;
    }

    setRemoveledID(appointment_id);

    const body = { appointment_id };

    fetch("/api/admin/remove_appointment_time_slot", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
      body: JSON.stringify(body),
    })
      .then(doRemoveAppointmentResp)
      .catch(doRemoveAppointmentError);
  }

  function doRemoveAppointmentResp(res: Response) {
    if (res.status === 200) {
      const p = res.json();
      p.then(doRemoveAppointmentJson);
      p.catch((ex) => doRemoveAppointmentError("200 response is not JSON", ex));
    } else if (res.status === 400) {
      const p = res.text();
      p.then(doRemoveAppointmentError);
      p.catch((ex) => doRemoveAppointmentError("400 response is not text", ex));
    } else {
      doRemoveAppointmentError(`Bad status code: ${res.status}`);
    }
  }

  function doRemoveAppointmentJson(_data: unknown) {
    setAppointments(
      appointments.filter((appointment) => {
        appointment.appointment_id != removedID;
      })
    );
  }

  function doRemoveAppointmentError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/admin/remove_appointment_time_slot failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function renderAppointments(): JSX.Element {
    const elements: JSX.Element[] = [];
    for (const appointment of appointments) {
      const hour_24 = appointment.hour_24;
      const date_formatted = formatDateForAppointment(parseDate(appointment.date));
      const hour_formatted = formatHour24ToHour12(hour_24);

      let booked_appointment_details: JSX.Element = <></>;
      if ("bookings" in appointment) {
        const bookings: JSX.Element[] = [];
        appointment.leader_name;
        for (const booking of appointment.bookings) {
          bookings.push(
            <li key={booking.email}>
              <p>
                Name: {booking.name}
                <br />
                Email: {booking.email}
                <br />
                Comments: {booking.comments}
              </p>
            </li>
          );
        }
        booked_appointment_details = (
          <>
            <p>
              Leader Name: {appointment.leader_name} <br />
              Subject: {appointment.subject}
              <br />
              Location: {appointment.location}
            </p>
            <ul>{bookings}</ul>
          </>
        );
      }
      elements.push(
        <li key={appointment.appointment_id}>
          <span>
            <p>
              {date_formatted} {hour_formatted} - {appointment.slots_booked}/{appointment.capacity} slots filled
            </p>
            {booked_appointment_details}
            <button onClick={() => doRemoveAppointment(appointment.appointment_id)}>Remove</button>
          </span>
        </li>
      );
    }

    return <ul>{elements}</ul>;
  }

  if (!loaded) {
    return <p>Loading info...</p>;
  }

  return (
    <>
      <AdminNavbar />
      <h1>Welcome, admin!</h1>
      <h2>This Month's Appointments</h2>
      {renderAppointments()}
    </>
  );
}

export default AdminAppointmentPanel;
