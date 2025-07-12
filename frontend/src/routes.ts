import { createBrowserRouter } from "react-router";
import App from "./App";
import Calendar from "./Calendar";
import AppointmentList from "./AppointmentList";
import BookingConfirmationForm from "./BookingConfirmationForm";

export const app_router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/book",
    Component: Calendar,
    children: [
      {
        path: ":date",
        Component: AppointmentList,
      },
    ],
  },
  {
    path: "/confirm_booking",
    Component: BookingConfirmationForm,
  },
]);
