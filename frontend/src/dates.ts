export type Date = { day: number; month: number; year: number };

/**
 * Maps each month's number to the number of days in the month. February doesn't have an entry since the number of days
 * in it varies.
 */
const month_to_number_of_days_map: Map<number, number> = new Map();
month_to_number_of_days_map.set(1, 31);
month_to_number_of_days_map.set(3, 31);
month_to_number_of_days_map.set(4, 30);
month_to_number_of_days_map.set(5, 31);
month_to_number_of_days_map.set(6, 30);
month_to_number_of_days_map.set(7, 31);
month_to_number_of_days_map.set(8, 31);
month_to_number_of_days_map.set(9, 30);
month_to_number_of_days_map.set(10, 31);
month_to_number_of_days_map.set(11, 30);
month_to_number_of_days_map.set(12, 31);

/**
 * Maps the 0-indexed day number to its corresponding weekday name.
 */
const day_of_week_map: Map<number, string> = new Map();
day_of_week_map.set(0, "Sunday");
day_of_week_map.set(1, "Monday");
day_of_week_map.set(2, "Tuesday");
day_of_week_map.set(3, "Wednesday");
day_of_week_map.set(4, "Thursday");
day_of_week_map.set(5, "Friday");
day_of_week_map.set(6, "Saturday");

/**
 * Maps each month's number to its name
 */
const month_name_map: Map<number, string> = new Map();
month_name_map.set(1, "January");
month_name_map.set(2, "February");
month_name_map.set(3, "March");
month_name_map.set(4, "April");
month_name_map.set(5, "May");
month_name_map.set(6, "June");
month_name_map.set(7, "July");
month_name_map.set(8, "August");
month_name_map.set(9, "September");
month_name_map.set(10, "October");
month_name_map.set(11, "November");
month_name_map.set(12, "December");

/**
 * Maps each month's number to its abbreviated (3-letter) name.
 */
const month_abbrev_name_map: Map<number, string> = new Map();
month_abbrev_name_map.set(1, "Jan");
month_abbrev_name_map.set(2, "Feb");
month_abbrev_name_map.set(3, "Mar");
month_abbrev_name_map.set(4, "Apr");
month_abbrev_name_map.set(5, "May");
month_abbrev_name_map.set(6, "Jun");
month_abbrev_name_map.set(7, "Jul");
month_abbrev_name_map.set(8, "Aug");
month_abbrev_name_map.set(9, "Sep");
month_abbrev_name_map.set(10, "Oct");
month_abbrev_name_map.set(11, "Nov");
month_abbrev_name_map.set(12, "Dec");

/**
 * Converts a date to a string, formatted like the following: {day}\_{month}\_{year}. Leading zeroes are added if
 * necessary.
 *
 * @param date Date to be converted.
 * @returns Date in string form.
 */
export const dateToString = (date: Date): string => {
  const month_str = date.month < 10 ? "0" + date.month : date.month.toString();
  const day_str = date.day < 10 ? "0" + date.day : date.day.toString();
  return month_str + "_" + day_str + "_" + date.year;
};

/**
 * Gets the current date in Chicago time.
 *
 * @returns Current date in [month, day, year] format.
 */
export const getDate = (): Date => {
  const date = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
  });
  const month_day_year: string = date.split(", ")[0];
  const month_day_year_list = month_day_year.split("/");
  const month = parseInt(month_day_year_list[0]);
  const day = parseInt(month_day_year_list[1]);
  const year = parseInt(month_day_year_list[2]);

  return { day, month, year };
};

/**
 * Gets the date of the day immediately following the passed-in date.
 *
 * @param date Date started from.
 * @returns The date of the next day after 'date'.
 */
export const getNextDay = (date: Date): Date => {
  const day = date.day;
  const month = date.month;
  const year = date.year;

  const last_day_of_month = getLastDayOfMonth(month, year);
  if (day < last_day_of_month) {
    return { day: day + 1, month: month, year: year };
  }

  if (month < 12) {
    return { day: 1, month: month + 1, year: year };
  }

  return { day: 1, month: 1, year: year + 1 };
};

/**
 * Gets the numerical day of the week of the given date in numerical format. Sunday is 0, Monday is 1, etc.
 * *
 * @returns Day of week.
 */
export const getDayOfWeek = (date: Date): number => {
  const day = date.day;
  const month = date.month;
  const year = date.year;

  // Zeller's congruence
  const q = day;
  const m = month >= 3 ? month : month + 2;
  const adjYear = month >= 3 ? year : year - 1;
  const K = adjYear % 100;
  const J = Math.floor(adjYear / 100);
  const h = (q + Math.floor((13 * (m + 1)) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) + 5 * J) % 7;
  const d = (h + 6) % 7;

  return d;
};

/**
 * Gets the name of the day of the week corresponding to the return value of getDayOfWeek.
 *
 * @param day_of_week Number corresponding to day of week. Range [0, 6].
 * @returns Weekday name.
 */
export const getDayOfWeekString = (day_of_week: number): string => {
  const result = day_of_week_map.get(day_of_week);
  if (result === undefined) {
    throw new Error("Invalid parameter to getDayOfWeekString.");
  }

  return result;
};

/**
 * Gets the name corresponding to the numberical month (e.g. 1 -> January, etc.)
 *
 * @param month Given month.
 * @returns Month name.
 */
export const getMonthString = (month: number): string => {
  const result = month_name_map.get(month);
  if (result === undefined) {
    throw new Error("Invalid parameter to getMonthString.");
  }

  return result;
};

/**
 * Gets the abbreviated name corresponding to the numberical month (e.g. 1 -> Jan, etc.)
 *
 * @param month Given month.
 * @returns Abbreviated month name.
 */
export const getAbbreviatedMonthString = (month: number): string => {
  const result = month_abbrev_name_map.get(month);
  if (result === undefined) {
    throw new Error("Invalid parameter to getAbbreviatedMonthString.");
  }

  return result;
};

/**
 * Gets the last valid day of the given month. For example, if the month passed in was 6 (June), would return 30
 * (representing June 30th). Accounts for leap years in the Gregorian Calendar.
 *
 * @param month Month started from.
 * @param year Current year.
 * @returns The last valid day in the given month.
 */
export const getLastDayOfMonth = (month: number, year: number): number => {
  if (month === 2) {
    // February, so we check for leap year status
    if (year % 4 === 0) {
      if (year % 100 === 0) {
        return year % 400 === 0 ? 29 : 28;
      } else {
        return 29;
      }
    } else {
      return 28;
    }
  } else {
    const result = month_to_number_of_days_map.get(month);
    if (result === undefined) {
      throw new Error("Invalid input to getLastDayOfMonth.");
    }

    return result;
  }
};

/**
 * Gets a "calendar" of dates, starting from the week including 'date', and including num_weeks into the future.
 *
 * @param date Date to start from.
 * @param num_weeks Number of weeks to include.
 * @returns An array of weeks, with each week being an array containing the 7 dates in that week.
 */
export const getCalendarDates = (date: Date, num_weeks: number): Array<Array<Date>> => {
  const day = date.day;
  const month = date.month;
  const year = date.year;

  const day_of_week = getDayOfWeek(date);
  const prev_month = month === 1 ? 12 : month - 1;
  const last_day_of_prev_month = getLastDayOfMonth(prev_month, year);

  // Note - this math works specifically because day_of_week is 0-indexed.
  const first_day_in_week = day - day_of_week;
  let cur_day = first_day_in_week > 0 ? first_day_in_week : first_day_in_week + last_day_of_prev_month;
  let cur_month = first_day_in_week > 0 ? month : prev_month;
  let cur_year = first_day_in_week <= 0 && month == 1 ? year - 1 : year;
  let cur_date = { day: cur_day, month: cur_month, year: cur_year };

  const calendar: Array<Array<Date>> = [];
  for (let week_count = 0; week_count < num_weeks; week_count++) {
    const week: Array<Date> = [];
    for (let i = 0; i < 7; i++) {
      week.push(cur_date);
      cur_date = getNextDay(cur_date);
    }
    calendar.push(week);
  }

  return calendar;
};
