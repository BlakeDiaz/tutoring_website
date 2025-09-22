import { createBrowserRouter } from "react-router";
import App from "./App";
import Calendar from "./Calendar";
import BookNewAppointmentForm from "./BookNewAppointmentForm";
import LoginForm from "./LoginForm";
import Dashboard from "./Dashboard";
import RegisterForm from "./RegisterForm";
import BookExistingAppointmentForm from "./BookExistingAppointmentForm";
import AdminAppointmentPanel from "./AdminAppointmentPanel";
import AdminHome from "./AdminHome";
import AdminAddAppointment from "./AdminAddAppointment";

export const app_router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/book",
    Component: Calendar,
  },
  {
    path: "/book_new_appointment",
    Component: BookNewAppointmentForm,
  },
  {
    path: "/book_existing_appointment",
    Component: BookExistingAppointmentForm,
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
  {
    path: "/admin",
    Component: AdminHome,
  },
  {
    path: "/admin_appointment_panel",
    Component: AdminAppointmentPanel,
  },
  {
    path: "/admin_add_appointment",
    Component: AdminAddAppointment,
  },
]);
