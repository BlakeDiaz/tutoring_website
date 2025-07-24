import { createBrowserRouter } from "react-router";
import App from "./App";
import Calendar from "./Calendar";
import AppointmentList from "./AppointmentList";
import BookingConfirmationForm from "./BookingConfirmationForm";
import LoginForm from "./LoginForm";
import Dashboard from "./Dashboard";
import RegisterForm from "./RegisterForm";

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
  {
    path: "/login",
    Component: LoginForm,
  },
  {
    path: "/register",
    Component: RegisterForm,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
]);
