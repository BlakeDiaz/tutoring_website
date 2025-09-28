import { useState } from "react";
import SiteNavbar from "./SiteNavbar";
import { Link, useNavigate, useSearchParams } from "react-router";
import { getRedirectURL } from "./redirects";
import FormError from "./FormError";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verify_password, setVerifyPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search_params, _setSearchParams] = useSearchParams();

  function doCancelClick(): void {
    navigate("/");
  }

  function doRegisterClick(): void {
    if (name === "" || email === "" || password === "" || verify_password === "") {
      return;
    }
    if (password !== verify_password) {
      setError("Password and Verify Password fields are different");
      return;
    }

    const body = {
      name: name,
      email: email,
      password: password,
    };
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(doRegisterResp)
      .catch(doRegisterError);
  }

  function doRegisterResp(res: Response): void {
    if (res.status === 200) {
      localStorage.setItem("logged_in", "true");
      const redirect_url = getRedirectURL("/", search_params);
      navigate(redirect_url);
    } else if (res.status === 400) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doRegisterError("400 response is not text", ex));
    } else if (res.status === 409) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doRegisterError("409 response is not text", ex));
    } else {
      doRegisterError(`Bad status code: ${res.status}`);
    }
  }

  function doRegisterError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/auth/register failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <div>
      <SiteNavbar />
      <div className="form-wrapper">
        <div className="form">
          <h1 className="form-header">Sign Up</h1>
          <FormError errorMessage={error} onCancelClick={() => setError("")}></FormError>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="name">
              Name:
            </label>
            <input
              className="form-input"
              type="text"
              id="name"
              name="name"
              placeholder="Enter your name"
              required
              onChange={(evt) => setName(evt.target.value)}
            />
          </div>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="email">
              Email Address:
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address"
              required
              onChange={(evt) => setEmail(evt.target.value)}
            />
          </div>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="password">
              Password:
            </label>
            <input
              className="form-input"
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              onChange={(evt) => setPassword(evt.target.value)}
            />
          </div>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="verify-password">
              Verify Password:
            </label>
            <input
              className="form-input"
              type="password"
              id="verify-password"
              name="verifypassword"
              placeholder="Re-enter your password"
              required
              onChange={(evt) => setVerifyPassword(evt.target.value)}
            />
          </div>
          <div className="form-button-wrapper">
            <button className="form-button" onClick={doCancelClick}>
              Cancel
            </button>
            <button className="form-button primary-button" onClick={doRegisterClick}>
              Sign Up
            </button>
          </div>
          <div className="form-redirect-wrapper">
            <Link className="redirect-link" to="/login">
              Already have an account? Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
