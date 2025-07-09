import { createBrowserRouter } from "react-router";
import App from "./App";
import Book from "./Book";

export const app_router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/book",
    Component: Book,
  },
]);
