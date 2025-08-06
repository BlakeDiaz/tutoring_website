import { isRecord } from "./types";

export type Booking = {
  name: string;
  email: string;
  comments: string;
};

export const parseBooking = (data: unknown): Booking => {
  if (!isRecord(data)) {
    throw new Error(`data is not a record: ${typeof data}`);
  }
  if (typeof data.name !== "string") {
    throw new Error(`data.name is not a string: ${typeof data.name}`);
  }
  if (typeof data.email !== "string") {
    throw new Error(`data.email is not a string: ${typeof data.email}`);
  }
  if (typeof data.comments !== "string") {
    throw new Error(`data.comments is not a string: ${typeof data.comments}`);
  }

  return {
    name: data.name,
    email: data.email,
    comments: data.comments,
  };
};

export const parseBookings = (data: unknown): Booking[] => {
  if (!Array.isArray(data)) {
    throw new Error(`data is not an array: ${typeof data}`);
  }

  const bookings: Booking[] = [];
  for (const booking of data) {
    bookings.push(parseBooking(booking));
  }

  return bookings;
};
