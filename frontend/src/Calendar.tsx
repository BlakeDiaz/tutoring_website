import { type JSX } from "react";
import { type Date, getDate, getCalendarDates, getAbbreviatedMonthString, dateToString } from "./dates";
import SiteNavbar from "./SiteNavbar";

const WEEK_COUNT = 6;

function Calendar() {
  return (
    <div>
      <SiteNavbar />
      {renderCalendar()}
    </div>
  );
}

const renderCalendar = (): JSX.Element => {
  const calendar_dates = getCalendarDates(getDate(), WEEK_COUNT);

  const rows: Array<JSX.Element> = [];
  for (let i = 0; i < calendar_dates.length; i++) {
    const row: Array<JSX.Element> = [];
    for (let j = 0; j < calendar_dates[0].length; j++) {
      const cur_date = calendar_dates[i][j];
      row.push(<td key={dateToString(cur_date)}>{formatDate(cur_date)}</td>);
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
};

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
