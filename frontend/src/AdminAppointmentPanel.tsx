import { useEffect, useState, type JSX } from "react";
import { getCookie } from "./cookies";
import { useNavigate } from "react-router";
import { parseAdminAppointments, type AdminAppointment } from "./admin_appointments";
import { isRecord } from "./types";
import {
  dateToString,
  formatDateForAppointmentSmall,
  formatHour24ToHour12,
  getDate,
  getFirstDateOfMonth,
  getFirstDateOfNextMonth,
  getFirstDateOfPrevMonth,
  getLastDateOfMonth,
  getMonthString,
  getNextDay,
  parseDate,
  type Date,
} from "./dates";
import AdminNavbar from "./AdminNavbar";
import "./Dashboard.css";

function AdminAppointmentPanel() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [date, setDate] = useState<Date>(getDate());
  const navigate = useNavigate();

  let removed_id: number | undefined = undefined;

  useEffect(() => {
    fetch("/api/admin/is_admin", {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
    })
      .then(doIsAdminResp)
      .catch(doIsAdminError);

    const start_date = getFirstDateOfMonth(date.month, date.year);
    const end_date = getNextDay(getLastDateOfMonth(date.month, date.year));
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
  }, [date]);

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

    removed_id = appointment_id;

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
    const new_appointments = appointments.filter((appointment) => {
      return appointment.appointment_id !== removed_id;
    });
    setAppointments(new_appointments);
  }

  function doRemoveAppointmentError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/admin/remove_appointment_time_slot failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function renderAppointments(): JSX.Element {
    const rows: JSX.Element[] = [];
    for (const appointment of appointments) {
      const appointment_date = parseDate(appointment.date);
      if (date.month === appointment_date.month && date.year === appointment_date.year)
        rows.push(
          <AdminAppointmentRow
            key={appointment.appointment_id}
            appointment={appointment}
            onRemoveClick={doRemoveAppointment}
          />
        );
    }

    return (
      <div className="appointment-table-container">
        <div className="appointment-table-header-wrapper">
          <button className="bubble-button" onClick={() => setDate(getFirstDateOfPrevMonth(date.month, date.year))}>
            {"<"}
          </button>
          <h2 className="appointment-table-header">
            {getMonthString(date.month)} {date.year}
          </h2>
          <button className="bubble-button" onClick={() => setDate(getFirstDateOfNextMonth(date.month, date.year))}>
            {">"}
          </button>
        </div>
        <table className="appointment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Slots Filled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }

  if (!loaded) {
    return (
      <>
        <AdminNavbar />
        <p>Loading info...</p>;
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <h1 className="dashboard-header">All Appointments</h1>
      <div className="appointment-table-wrapper">{renderAppointments()}</div>
    </>
  );
}

type AdminAppointmentRowProps = {
  appointment: AdminAppointment;
  onRemoveClick: (appointment_id: number) => void;
};

function AdminAppointmentRow(props: AdminAppointmentRowProps) {
  const [display_details, setDisplayDetails] = useState(false);

  const hour_24 = props.appointment.hour_24;
  const date_formatted = formatDateForAppointmentSmall(parseDate(props.appointment.date));
  const hour_formatted = formatHour24ToHour12(hour_24);

  function doRemoveClick() {
    props.onRemoveClick(props.appointment.appointment_id);
  }

  function doShowToggleClick() {
    setDisplayDetails(!display_details);
  }

  function renderDetails() {
    if (!("bookings" in props.appointment)) {
      return <></>;
    }

    return (
      <>
        <h3 className="details-row-header">Details</h3>
        <div className="details-row-wrapper">
          <p className="details-item">
            <strong>Leader: </strong>
            {props.appointment.leader_name}
          </p>
          <p className="details-item">
            <strong>Location: </strong>
            {props.appointment.location}
          </p>
          <p className="details-item">
            <strong>Subject: </strong>
            {props.appointment.subject}
          </p>
        </div>
        <h3 className="details-row-header">Participants</h3>
      </>
    );
  }

  function renderBookings() {
    if (!("bookings" in props.appointment)) {
      return <></>;
    }

    const bookings: JSX.Element[] = [];
    for (const booking of props.appointment.bookings) {
      bookings.push(
        <li className="participant-card" key={booking.email}>
          <p className="participant-info">
            <strong>Name: </strong>
            {booking.name}
          </p>
          <p className="participant-info">
            <strong>Email: </strong>
            {booking.email}
          </p>
          {booking.comments != "" ? (
            <p className="participant-info">
              <strong>Comments: </strong>
              {booking.comments}
            </p>
          ) : (
            <></>
          )}
        </li>
      );
    }

    return <ul className="participants-list">{bookings}</ul>;
  }

  function getDetailsRowClassName() {
    if (display_details) {
      return "details-row show";
    }
    return "details-row";
  }

  function getDetailsContentClassName() {
    if (display_details) {
      return "details-content show";
    }

    return "details-content";
  }

  return (
    <>
      <tr>
        <td>{date_formatted}</td>
        <td>{hour_formatted}</td>
        <td>
          {props.appointment.slots_booked}/{props.appointment.capacity}
        </td>
        <td>
          <button className="toggle-button" onClick={doShowToggleClick}>
            {display_details ? "Show Less" : "Show More"}
          </button>
        </td>
      </tr>
      <tr className={getDetailsRowClassName()}>
        <td colSpan={4}>
          <div className={getDetailsContentClassName()}>
            {renderDetails()}
            {renderBookings()}
            <div className="cancel-button-wrapper">
              <button className="cancel-button" onClick={doRemoveClick}>
                Remove Appointment
              </button>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

export default AdminAppointmentPanel;
