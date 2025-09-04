import { useEffect, useState, type JSX } from "react";
import SiteNavbar from "./SiteNavbar";
import { useNavigate, useSearchParams } from "react-router";
import { getCookie } from "./cookies";
import { createRedirectSearchParams } from "./redirects";
import "./BookingForm.css";

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
      <div className="booking-form">
        <h1>Confirm Your Appointment</h1>
        <ul>
          <li>
            <div className="booking-input">
              <label htmlFor="subject">What subject would you like to cover?</label>
              <br />
              <textarea
                rows={5}
                cols={50}
                id="subject"
                name="subject"
                required
                placeholder="Enter subject here"
                onChange={(evt) => setSubject(evt.target.value)}
              />
            </div>
          </li>
          <li>
            <div className="booking-input">
              <label htmlFor="location">Where on campus would you like to meet?</label>
              <br />
              <textarea
                rows={5}
                cols={50}
                id="location"
                name="location"
                required
                placeholder="Enter location here"
                onChange={(evt) => setLocation(evt.target.value)}
              />
            </div>
          </li>
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
            <div className="booking-buttons">
              <button onClick={doCancelClick}>Cancel</button>
              <button onClick={doBookAppointmentClick}>Book Appointment</button>
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

export default BookNewAppointmentForm;
