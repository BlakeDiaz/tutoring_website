import { Link } from "react-router";
import { type Date, formatDateForAppointmentSmall, formatHour24ToHour12 } from "./dates";
import { type JSX } from "react";
import { type Appointment } from "./appointments";
import "./AppointmentList.css";

function AppointmentList(props: { date: Date; appointments: Appointment[] }) {
  const date_formatted = formatDateForAppointmentSmall(props.date);

  return (
    <div className="appointment-list">
      <h1 className="appointment-list-header">{date_formatted}</h1>
      {renderAppointmentBookingLinks(props.appointments)}
    </div>
  );
}

const renderAppointmentBookingLinks = (appointments: Appointment[]): JSX.Element => {
  const links: JSX.Element[] = [];
  for (const appointment of appointments) {
    const hour_24 = appointment.hour_24;
    const hour_formatted = formatHour24ToHour12(hour_24);

    const pathname = appointment.slots_booked === 0 ? "/book_new_appointment" : "/book_existing_appointment";
    links.push(
      <li key={appointment.appointment_id}>
        <Link
          className="appointment-list-link"
          to={{
            pathname: pathname,
            search: `appointment_id=${encodeURIComponent(appointment.appointment_id)}`,
          }}
        >
          {hour_formatted} - {appointment.capacity - appointment.slots_booked}/{appointment.capacity} slots available
        </Link>
      </li>
    );
  }

  return <ul className="appointment-list-links">{links}</ul>;
};

export default AppointmentList;
