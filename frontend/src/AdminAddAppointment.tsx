import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import { getCookie } from "./cookies";
import AdminNavbar from "./AdminNavbar";
import { compareDates, getDate, parseDate } from "./dates";
import FormError from "./FormError";
import FormSuccess from "./FormSuccess";
import "./Form.css";

type ResultStatus = "success" | "error" | "none";

function AdminAddAppointment() {
  const [date, setDate] = useState("");
  const [hour_24, setHour24] = useState("0");
  const [capacity, setCapacity] = useState("1");
  const [result_message, setResultMessage] = useState("");
  const [result_status, setResultStatus] = useState<ResultStatus>("none");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/is_admin", {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
    })
      .then(doIsAdminResp)
      .catch(doIsAdminError);
  });

  function doIsAdminResp(res: Response) {
    if (res.status === 200) {
      return;
    } else if (res.status === 401) {
      navigate("/");
    } else {
      doIsAdminError(`Bad status code: ${res.status}`);
      navigate("/");
    }
  }

  function doIsAdminError(msg: string, ex?: unknown) {
    console.error(`fetch of /api/admin/is_admin failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function doCancelClick() {
    navigate("/admin");
  }

  function doClearResultClick() {
    setResultMessage("");
    setResultStatus("none");
  }

  function doAddAppointmentClick(): void {
    if (date === "") {
      setResultMessage("Date required");
      setResultStatus("error");
      return;
    }
    if (hour_24 === "") {
      setResultMessage("Time required");
      setResultStatus("error");
      return;
    }
    if (capacity === "") {
      setResultMessage("Capacity required");
      setResultStatus("error");
      return;
    }

    const appointment_date = parseDate(date);
    const today_date = getDate();
    if (compareDates(appointment_date, today_date) < 0) {
      setResultMessage("Invalid date");
      setResultStatus("error");
      return;
    }

    const body = {
      date,
      hour_24,
      capacity,
    };
    fetch("/api/admin/add_appointment_time_slot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("csrf_access_token"),
      },
      body: JSON.stringify(body),
    })
      .then(doAddAppointmentResp)
      .catch(doAddAppointmentError);
  }

  function doAddAppointmentResp(res: Response): void {
    if (res.status === 200) {
      setResultMessage("Successfully added appointment");
      setResultStatus("success");
    } else if (res.status === 400) {
      setResultStatus("error");
      const p = res.text();
      p.then(setResultMessage);
      p.catch((ex) => doAddAppointmentError("400 response is not text", ex));
    } else if (res.status === 401) {
      // User is not logged in
      navigate("/login");
    } else if (res.status === 409) {
      setResultStatus("error");
      const p = res.text();
      p.then(setResultMessage);
      p.catch((ex) => doAddAppointmentError("409 response is not text", ex));
    } else {
      doAddAppointmentError(`Bad status code: ${res.status}`);
    }
  }

  function doAddAppointmentError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/admin/add_appointment_time_slot failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  function renderDateInput(): JSX.Element {
    return (
      <div className="form-input-wrapper">
        <label className="form-input-label" htmlFor="date">
          Appointment Date:
        </label>
        <input className="form-input" name="date" type="date" onChange={(evt) => setDate(evt.target.value)} />
      </div>
    );
  }

  function renderHour24Input(): JSX.Element {
    return (
      <div className="form-input-wrapper">
        <label className="form-input-label" htmlFor="hour">
          Appointment Time:
        </label>
        <select className="form-select" name="hour" value="0" onChange={(evt) => setHour24(evt.target.value)}>
          <option key="0" value="0">
            12:00 AM
          </option>
          <option key="1" value="1">
            1:00 AM
          </option>
          <option key="2" value="2">
            2:00 AM
          </option>
          <option key="3" value="3">
            3:00 AM
          </option>
          <option key="4" value="4">
            4:00 AM
          </option>
          <option key="5" value="5">
            5:00 AM
          </option>
          <option key="6" value="6">
            6:00 AM
          </option>
          <option key="7" value="7">
            7:00 AM
          </option>
          <option key="8" value="8">
            8:00 AM
          </option>
          <option key="9" value="9">
            9:00 AM
          </option>
          <option key="10" value="10">
            10:00 AM
          </option>
          <option key="11" value="11">
            11:00 AM
          </option>
          <option key="12" value="12">
            12:00 PM
          </option>
          <option key="13" value="13">
            1:00 PM
          </option>
          <option key="14" value="14">
            2:00 PM
          </option>
          <option key="15" value="15">
            3:00 PM
          </option>
          <option key="16" value="16">
            4:00 PM
          </option>
          <option key="17" value="17">
            5:00 PM
          </option>
          <option key="18" value="18">
            6:00 PM
          </option>
          <option key="19" value="19">
            7:00 PM
          </option>
          <option key="20" value="20">
            8:00 PM
          </option>
          <option key="21" value="21">
            9:00 PM
          </option>
          <option key="22" value="22">
            10:00 PM
          </option>
          <option key="23" value="23">
            11:00 PM
          </option>
        </select>
      </div>
    );
  }

  function renderCapacityInput(): JSX.Element {
    return (
      <div className="form-input-wrapper">
        <label className="form-input-label" htmlFor="capacity">
          Capacity:
        </label>
        <select className="form-select" name="capacity" value="1" onChange={(evt) => setCapacity(evt.target.value)}>
          <option key="1" value="1">
            1
          </option>
          <option key="2" value="2">
            2
          </option>
          <option key="3" value="3">
            3
          </option>
          <option key="4" value="4">
            4
          </option>
          <option key="5" value="5">
            5
          </option>
          <option key="6" value="6">
            6
          </option>
          <option key="7" value="7">
            7
          </option>
          <option key="8" value="8">
            8
          </option>
          <option key="9" value="9">
            9
          </option>
          <option key="10" value="10">
            10
          </option>
          <option key="11" value="11">
            11
          </option>
          <option key="12" value="12">
            12
          </option>
        </select>
      </div>
    );
  }

  function renderFormResult(): JSX.Element {
    if (result_status === "success") {
      return <FormSuccess successMessage={result_message} onCancelClick={doClearResultClick} />;
    } else if (result_status === "error") {
      return <FormError errorMessage={result_message} onCancelClick={doClearResultClick} />;
    } else {
      return <></>;
    }
  }

  return (
    <>
      <AdminNavbar />
      <div className="form-wrapper">
        <div className="form">
          <h1 className="form-header">Add an Appointment</h1>
          {renderFormResult()}
          {renderDateInput()}
          {renderHour24Input()}
          {renderCapacityInput()}
          <div className="form-button-wrapper">
            <button className="form-button" onClick={doCancelClick}>
              Cancel
            </button>
            <button className="form-button primary-button" onClick={doAddAppointmentClick}>
              Add Appointment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminAddAppointment;
