import { useNavigate } from "react-router";
import AdminNavbar from "./AdminNavbar";
import { useEffect } from "react";
import { getCookie } from "./cookies";

function AdminHome() {
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

  return (
    <>
      <AdminNavbar />
      <p>Welcome to the admin page!</p>
    </>
  );
}

export default AdminHome;
