import "./Form.css";

function FormError(props: { errorMessage: string }) {
  if (props.errorMessage === "") {
    return <></>;
  } else {
    return (
      <div className="form-error-wrapper">
        <p className="form-error">{props.errorMessage}</p>
      </div>
    );
  }
}

export default FormError;
