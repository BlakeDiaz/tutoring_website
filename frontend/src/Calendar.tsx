import { useEffect, useState, type JSX } from "react";
import {
  type Date,
  getDate,
  getCalendarDatesForMonth,
  getAbbreviatedMonthString,
  dateToString,
  getFirstDateOfMonth,
  getLastDateOfMonth,
  getNextDay,
} from "./dates";
import SiteNavbar from "./SiteNavbar";
import { isRecord } from "./types";
import { parseAppointments, type Appointment } from "./appointments";
import AppointmentList from "./AppointmentList";

function Calendar() {
  let date = getDate();

  const [appointments_map, setAppointmentsMap] = useState<Map<string, Appointment[]>>();
  const [selected_date, setSelectedDate] = useState<Date>();

  useEffect(() => {
    const start_date = getFirstDateOfMonth(date.month, date.year);
    const end_date = getNextDay(getLastDateOfMonth(date.month, date.year));
    const url = `/api/book/get_available_appointments?start_date=${encodeURIComponent(
      dateToString(start_date)
    )}&end_date=${encodeURIComponent(dateToString(end_date))}`;
    fetch(url).then(doGetAvailableAppointmentsResp).catch(doGetAvailableAppointmentsError);
  }, [date]);

  function doGetAvailableAppointmentsResp(res: Response): void {
    if (res.status === 200) {
      const p = res.json();
      p.then(doGetAvailableAppointmentsJson);
      p.catch((ex) => doGetAvailableAppointmentsError("200 response is not JSON", ex));
    } else {
      doGetAvailableAppointmentsError(`Bad status code: ${res.status}`);
    }
  }

  function doGetAvailableAppointmentsJson(data: unknown): void {
    if (!isRecord(data)) {
      throw new Error(`data is not a record: ${typeof data}`);
    }

    const retrieved_appointments = parseAppointments(data.appointments);
    const map = new Map<string, Appointment[]>();

    for (const appointment of retrieved_appointments) {
      const date_list = map.get(appointment.date);
      if (date_list === undefined) {
        map.set(appointment.date, [appointment]);
      } else {
        date_list.push(appointment);
      }
    }
    console.log(map);
    setAppointmentsMap(map);
  }

  function doGetAvailableAppointmentsError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/book/get_available_appointments failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function renderCalendar(): JSX.Element {
    const date = getDate();
    const calendar_dates = getCalendarDatesForMonth(date.month, date.year);

    const rows: Array<JSX.Element> = [];
    for (let i = 0; i < calendar_dates.length; i++) {
      const row: Array<JSX.Element> = [];
      for (let j = 0; j < calendar_dates[0].length; j++) {
        const cur_date = calendar_dates[i][j];
        const disabled = cur_date.month !== date.month || !appointments_map?.has(dateToString(cur_date));
        row.push(
          <td key={dateToString(cur_date)}>
            <button disabled={disabled} onClick={() => setSelectedDate(cur_date)}>
              {formatDate(cur_date)}
            </button>
          </td>
        );
      }
      rows.push(<tr key={dateToString(calendar_dates[i][0])}>{row}</tr>);
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Sunday</th>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
            <th>Thursday</th>
            <th>Friday</th>
            <th>Saturday</th>
          </tr>
        </thead>
        <tbody className="thing">{rows}</tbody>
      </table>
    );
  }

  function renderAppointmentList(): JSX.Element {
    if (selected_date === undefined) {
      return <></>;
    }

    if (appointments_map === undefined) {
      console.error("Error: Apppointments map undefiend");
      return <></>;
    }

    const appointments = appointments_map.get(dateToString(selected_date));
    if (appointments === undefined) {
      console.error(`Error: Appointments for date ${dateToString(selected_date)} undefined`);
      return <></>;
    }

    return <AppointmentList date={selected_date} appointments={appointments}></AppointmentList>;
  }

  return (
    <div>
      <SiteNavbar />
      {renderCalendar()}
      {renderAppointmentList()}
    </div>
  );
}

/**
 * Formats a date into <Abbreviated month name> <Day number> format.
 * For example, the date {day: 7, month: 3, year: 2024} would be formatted as "Apr 7".
 * @param date The date to be formatted.
 * @returns Formatted date as a string.
 */
const formatDate = (date: Date): string => {
  if (date.day === 1) {
    return getAbbreviatedMonthString(date.month) + " " + date.day;
  }

  return date.day.toString();
};

export default Calendar;
