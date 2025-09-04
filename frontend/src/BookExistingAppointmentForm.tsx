import { useEffect, useState, type JSX } from "react";
import SiteNavbar from "./SiteNavbar";
import { useNavigate, useSearchParams } from "react-router";
import { getCookie } from "./cookies";
import { createRedirectSearchParams } from "./redirects";
import "./BookingForm.css";

const confirmation_code_format_regex = /^\d\d\d\d\d\d$/;

function BookExistingAppointmentForm() {
  const [comments, setComments] = useState("");
  const [confirmation_code, setConfirmationCode] = useState("");
  const [search_params, _setSearchParams] = useSearchParams();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // User is not logged in
    if (localStorage.getItem("logged_in") !== "true") {
      const redirect_search_params = createRedirectSearchParams("/book_existing_appointment", search_params);
      navigate(`/login?${redirect_search_params.toString()}`);
    }
  });

  function doCancelClick(): void {
    navigate("/book");
  }

  function doBookExistingAppointmentClick(): void {
    if (!confirmation_code_format_regex.test(confirmation_code)) {
      setError("Confirmation code must be 6 numeric characters");
      return;
    }

    const body = {
      appointment_id: search_params.get("appointment_id"),
      comments,
      confirmation_code,
    };
    fetch("/api/book/book_existing_appointment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
      body: JSON.stringify(body),
    })
      .then(doBookExistingAppointmentResp)
      .catch(doBookExistingAppointmentError);
  }

  function doBookExistingAppointmentResp(res: Response): void {
    if (res.status === 200) {
      navigate("/dashboard");
    } else if (res.status === 400) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doBookExistingAppointmentError("400 response is not text", ex));
    } else if (res.status === 401) {
      const p = res.text();
      p.then(doBookExistingAppointmentAuthError);
      p.catch((ex) => doBookExistingAppointmentError("401 response is not text", ex));
    } else if (res.status === 409) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doBookExistingAppointmentError("409 response is not text", ex));
    } else {
      doBookExistingAppointmentError(`Bad status code: ${res.status}`);
    }
  }

  function doBookExistingAppointmentAuthError(msg: string): void {
    if (msg === "Incorrect confirmation code") {
      // Confirmation code was incorrect
      setError(msg);
    } else {
      // User is not logged in
      const redirect_search_params = createRedirectSearchParams("/book_existing_appointment", search_params);
      navigate(`/login?${redirect_search_params.toString()}`);
    }
  }

  function doBookExistingAppointmentError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/book/book_existing_appointment failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <div>
      <SiteNavbar />
      <div className="booking-form">
        <h1>Confirm Your Appointment</h1>
        <ul>
          <li>
            <div className="booking-input">
              <label htmlFor="comments">Any additional comments?</label>
              <br />
              <textarea
                rows={5}
                cols={50}
                id="comments"
                name="comments"
                placeholder="Enter comments here"
                onChange={(evt) => setComments(evt.target.value)}
              />
            </div>
          </li>
          <li>
            <div className="booking-input">
              <label htmlFor="confirmation_code">Confirmation Code</label>
              <br />
              <input
                type="text"
                id="confirmation_code"
                name="confirmation_code"
                required
                placeholder="Enter confirmation code here"
                onChange={(evt) => setConfirmationCode(evt.target.value)}
              />
            </div>
          </li>
          <li>
            <div className="booking-buttons">
              <button onClick={doCancelClick}>Cancel</button>
              <button onClick={doBookExistingAppointmentClick}>Book Appointment</button>
            </div>
          </li>
        </ul>
        {renderError(error)}
      </div>
    </div>
  );
}

const renderError = (error: string): JSX.Element => {
  if (error === "") {
    return <></>;
  } else {
    return (
      <>
        <br />
        <p>{error}</p>
      </>
    );
  }
};

export default BookExistingAppointmentForm;
