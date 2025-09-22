import { Link } from "react-router";
import { type Date, formatHour24ToHour12 } from "./dates";
import { type JSX } from "react";
import { type Appointment } from "./appointments";
import { formatDateForAppointment } from "./dates";

function AppointmentList(props: { date: Date; appointments: Appointment[] }) {
  const date_formatted = formatDateForAppointment(props.date);

  return (
    <div>
      <h2>{date_formatted}</h2>
      {renderAppointmentBookingLinks(props.appointments)}
    </div>
  );
}

const renderAppointmentBookingLinks = (appointments: Appointment[]): JSX.Element => {
  const links: JSX.Element[] = [];
  for (const appointment of appointments) {
    const hour_24 = appointment.hour_24;
    const hour_formatted = formatHour24ToHour12(hour_24);

    if (appointment.slots_booked === 0) {
      links.push(
        <li key={appointment.appointment_id}>
          <Link
            to={{
              pathname: "/book_new_appointment",
              search: `appointment_id=${encodeURIComponent(appointment.appointment_id)}`,
            }}
          >
            {hour_formatted}
          </Link>
        </li>
      );
    } else {
      links.push(
        <li key={appointment.appointment_id}>
          <Link
            to={{
              pathname: "/book_existing_appointment",
              search: `appointment_id=${encodeURIComponent(appointment.appointment_id)}`,
            }}
          >
            {hour_formatted}
          </Link>
        </li>
      );
    }
  }

  return <ul>{links}</ul>;
};

export default AppointmentList;
