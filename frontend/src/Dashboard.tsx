import React, { useEffect, useState, type JSX } from "react";
import { getCookie } from "./cookies";
import { createRedirectSearchParams } from "./redirects";
import { useNavigate } from "react-router";
import { isRecord } from "./types";
import { type DashboardAppointment, parseDashboardAppointments } from "./dashboard_appointments";
import { parseDate, formatHour24ToHour12, formatDateForAppointmentSmall } from "./dates";
import SiteNavbar from "./SiteNavbar";
import { type User, parseUser } from "./users";
import "./Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState<User>();
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [cancelledID, setCancelledID] = useState<number>();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/auth/get_user_info", {
      method: "GET",
      headers: {
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
    })
      .then(doGetUserInfoResp)
      .catch(doGetUserInfoError);

    fetch("/api/book/get_scheduled_appointments", {
      method: "GET",
      headers: {
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
    })
      .then(doGetScheduledAppointmentsResp)
      .catch(doGetScheduledAppointmentsError);
  }, []);

  function doGetUserInfoResp(res: Response) {
    if (res.status === 200) {
      const p = res.json();
      p.then(doGetUserInfoJson);
      p.catch((ex) => doGetUserInfoError("200 response is not JSON", ex));
    } else if (res.status === 400) {
      const p = res.text();
      p.then(doGetUserInfoError);
      p.catch((ex) => doGetUserInfoError("400 response is not text", ex));
    } else if (res.status === 401) {
      // User is not logged in
      const redirect_search_params = createRedirectSearchParams("/dashboard");
      navigate(`/login?${redirect_search_params.toString()}`);
    } else {
      doGetUserInfoError(`Bad status code: ${res.status}`);
    }
  }

  function doGetUserInfoJson(data: unknown) {
    // TODO more robust error handling
    const retrieved_user = parseUser(data);
    setUser(retrieved_user);
  }

  function doGetUserInfoError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/auth/get_user_info failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function doGetScheduledAppointmentsResp(res: Response) {
    if (res.status === 200) {
      const p = res.json();
      p.then(doGetScheduledAppointmentsJson);
      p.catch((ex) => doGetScheduledAppointmentsError("200 response is not JSON", ex));
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
    const retrieved_appointments = parseDashboardAppointments(data.appointments);
    setAppointments(retrieved_appointments);
  }

  function doGetScheduledAppointmentsError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/book/get_scheduled_appointments failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function doCancelAppointment(appointment_id: number) {
    if (!window.confirm("Are you sure that you want to cancel this appointment?")) {
      return;
    }

    setCancelledID(appointment_id);

    const body = { appointment_id };

    fetch("/api/book/cancel_appointment", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
      body: JSON.stringify(body),
    })
      .then(doCancelAppointmentResp)
      .catch(doCancelAppointmentError);
  }

  function doCancelAppointmentResp(res: Response) {
    if (res.status === 200) {
      const p = res.json();
      p.then(doCancelAppointmentJson);
      p.catch((ex) => doCancelAppointmentError("200 response is not JSON", ex));
    } else if (res.status === 400) {
      const p = res.text();
      p.then(doCancelAppointmentError);
      p.catch((ex) => doCancelAppointmentError("400 response is not text", ex));
    } else {
      doCancelAppointmentError(`Bad status code: ${res.status}`);
    }
  }

  function doCancelAppointmentJson(_data: unknown) {
    // TODO more robust error handling
    setAppointments(
      appointments.filter((appointment) => {
        appointment.appointment_id != cancelledID;
      })
    );
  }

  function doCancelAppointmentError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/book/cancel_appointment failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function renderAppointments(): JSX.Element {
    const rows: JSX.Element[] = [];
    for (const appointment of appointments) {
      rows.push(<AppointmentRow appointment={appointment} onCancelClick={doCancelAppointment} />);
    }

    return (
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
    );
  }

  if (user === undefined) {
    return (
      <>
        <SiteNavbar />
        <p>Loading info...</p>
      </>
    );
  }

  return (
    <>
      <SiteNavbar />
      <h1>Welcome, {user.name}</h1>
      <h2>Your Appointments</h2>
      <div className="appointment-table-wrapper">{renderAppointments()}</div>
    </>
  );
}

type AppointmentRowProps = {
  appointment: DashboardAppointment;
  onCancelClick: (appointment_id: number) => void;
};

function AppointmentRow(props: AppointmentRowProps) {
  const [display_details, setDisplayDetails] = useState(false);

  const hour_24 = props.appointment.hour_24;
  const date_formatted = formatDateForAppointmentSmall(parseDate(props.appointment.date));
  const hour_formatted = formatHour24ToHour12(hour_24);

  function doCancelClick() {
    props.onCancelClick(props.appointment.appointment_id);
  }

  function doShowToggleClick() {
    setDisplayDetails(!display_details);
  }

  function renderBookings() {
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
    <React.Fragment key={props.appointment.appointment_id}>
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
            {renderBookings()}
            <div className="cancel-button-wrapper">
              <button className="cancel-button" onClick={doCancelClick}>
                Cancel Appointment
              </button>
            </div>
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
}

export default Dashboard;
