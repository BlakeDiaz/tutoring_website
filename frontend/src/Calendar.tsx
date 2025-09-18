import { useState, type JSX } from "react";
import { type Date, getDate, getCalendarDates, getAbbreviatedMonthString, dateToString, compareDates } from "./dates";
import SiteNavbar from "./SiteNavbar";
import { Link, Outlet } from "react-router";
import "./Calendar.css";

const WEEK_COUNT = 6;

function Calendar() {
  const [last_clicked_link_date, setLastClickedLinkDate] = useState<Date>();

  function getCalenderLinkClassName(date: Date) {
    if (last_clicked_link_date === undefined) {
      return "";
    }
    if (compareDates(last_clicked_link_date, date) !== 0) {
      return "";
    }
    return "last-clicked";
  }

  function doCalenderLinkClick(date: Date) {
    setLastClickedLinkDate(date);
  }

  const renderCalendar = (): JSX.Element => {
    const calendar_dates = getCalendarDates(getDate(), WEEK_COUNT);

    const rows: Array<JSX.Element> = [];
    for (let i = 0; i < calendar_dates.length; i++) {
      const row: Array<JSX.Element> = [];
      for (let j = 0; j < calendar_dates[0].length; j++) {
        const cur_date = calendar_dates[i][j];
        row.push(
          <td key={dateToString(cur_date)}>
            <CalendarLink
              className={getCalenderLinkClassName(cur_date)}
              date={cur_date}
              onClick={doCalenderLinkClick}
            ></CalendarLink>
          </td>
        );
      }
      rows.push(<tr key={dateToString(calendar_dates[i][0])}>{row}</tr>);
    }

    return (
      <table className="calendar">
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
        <tbody>{rows}</tbody>
      </table>
    );
  };

  return (
    <div>
      <SiteNavbar />
      <h1>Book an Appointment</h1>
      <div className="calendar-wrapper">
        <div className="calendar-layout">
          <div className="calendar-pane">{renderCalendar()}</div>
          <div className="appointment-list-pane">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

type CalendarLinkProps = {
  className: string;
  date: Date;
  onClick: (date: Date) => void;
};

function CalendarLink(props: CalendarLinkProps) {
  function handleClick() {
    return props.onClick(props.date);
  }

  return (
    <Link className={props.className} onClick={handleClick} to={{ pathname: `/book/${dateToString(props.date)}` }}>
      {formatDate(props.date)}
    </Link>
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
