import { useEffect, useState } from "react";
import SiteNavbar from "./SiteNavbar";
import { useNavigate, useSearchParams } from "react-router";
import { getCookie } from "./cookies";
import { createRedirectSearchParams } from "./redirects";
import FormError from "./FormError";
import "./Form.css";

function BookNewAppointmentForm() {
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [comments, setComments] = useState("");
  const [search_params, _setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // User is not logged in
    if (localStorage.getItem("logged_in") !== "true") {
      const redirect_search_params = createRedirectSearchParams("/book_new_appointment", search_params);
      navigate(`/login?${redirect_search_params.toString()}`);
    }
  });

  function doCancelClick(): void {
    navigate("/book");
  }

  function doBookAppointmentClick(): void {
    if (subject === "" || location === "") {
      return;
    }

    const body = {
      appointment_id: search_params.get("appointment_id"),
      subject,
      location,
      comments,
    };
    fetch("/api/book/book_new_appointment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
      body: JSON.stringify(body),
    })
      .then(doBookAppointmentResp)
      .catch(doBookAppointmentError);
  }

  function doBookAppointmentResp(res: Response): void {
    if (res.status === 200) {
      navigate("/dashboard");
    } else if (res.status === 400) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doBookAppointmentError("400 response is not text", ex));
    } else if (res.status === 401) {
      // User is not logged in
      const redirect_search_params = createRedirectSearchParams("/book_new_appointment", search_params);
      navigate(`/login?${redirect_search_params.toString()}`);
    } else if (res.status === 409) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doBookAppointmentError("409 response is not text", ex));
    } else {
      doBookAppointmentError(`Bad status code: ${res.status}`);
    }
  }

  function doBookAppointmentError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/book/book_new_appointment failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <div>
      <SiteNavbar />
      <div className="form-wrapper">
        <div className="form">
          <h1 className="form-header">Confirm Your Appointment</h1>
          <FormError errorMessage={error} onCancelClick={() => setError("")}></FormError>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="subject">
              What subject would you like to cover?
            </label>
            <input
              className="form-input"
              type="text"
              id="subject"
              name="subject"
              placeholder="Enter appointment subject"
              required
              onChange={(evt) => setSubject(evt.target.value)}
            />
          </div>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="location">
              Where on campus would you like to meet?
            </label>
            <input
              className="form-input"
              type="text"
              id="location"
              name="location"
              placeholder="Enter appointment location"
              required
              onChange={(evt) => setLocation(evt.target.value)}
            />
          </div>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="comments">
              Any additional comments?
            </label>
            <input
              className="form-input"
              type="text"
              id="comments"
              name="comments"
              placeholder="Enter your comments"
              onChange={(evt) => setComments(evt.target.value)}
            />
          </div>
          <div className="form-button-wrapper">
            <button className="form-button" onClick={doCancelClick}>
              Cancel
            </button>
            <button className="form-button primary-button" onClick={doBookAppointmentClick}>
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookNewAppointmentForm;
