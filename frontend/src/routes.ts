import { createBrowserRouter } from "react-router";
import App from "./App";
import Calendar from "./Calendar";

export const app_router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/book",
    Component: Calendar,
  },
]);
