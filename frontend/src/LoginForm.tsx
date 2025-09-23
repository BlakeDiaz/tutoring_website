import { useState } from "react";
import SiteNavbar from "./SiteNavbar";
import { Link, useNavigate, useSearchParams } from "react-router";
import { getRedirectURL } from "./redirects";
import "./Form.css";
import FormError from "./FormError";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search_params, _setSearchParams] = useSearchParams();

  function doCancelClick(): void {
    navigate("/");
  }

  function doLoginClick(): void {
    if (email === "" || password === "") {
      return;
    }

    const body = {
      email: email,
      password: password,
    };
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(doLoginResp)
      .catch(doLoginError);
  }

  function doLoginResp(res: Response): void {
    if (res.status === 200) {
      localStorage.setItem("logged_in", "true");
      const redirect_url = getRedirectURL("/", search_params);
      navigate(redirect_url);
    } else if (res.status === 400) {
      const p = res.text();
      p.then(setError);
      p.catch((ex) => doLoginError("400 response is not text", ex));
    } else {
      doLoginError(`Bad status code: ${res.status}`);
    }
  }

  function doLoginError(msg: string, ex?: unknown): void {
    console.error(`fetch of /api/auth/login failed: ${msg}`);
    if (ex instanceof Error) {
      throw ex;
    }
  }

  return (
    <div>
      <SiteNavbar />
      <div className="form-wrapper">
        <div className="form">
          <h1 className="form-header">Log In</h1>
          <FormError errorMessage={error}></FormError>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="password">
              Email Address
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
              onChange={(evt) => setEmail(evt.target.value)}
            />
          </div>
          <div className="form-input-wrapper">
            <label className="form-input-label" htmlFor="password">
              Password
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
          <div className="form-button-wrapper">
            <button className="form-button" onClick={doCancelClick}>
              Cancel
            </button>
            <button className="form-button primary-button" onClick={doLoginClick}>
              Login
            </button>
          </div>
          <div className="form-redirect-wrapper">
            <Link className="redirect-link" to="/register">
              Don't have an account? Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
