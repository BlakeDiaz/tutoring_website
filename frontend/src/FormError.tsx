import "./Form.css";

type FormErrorProps = {
  errorMessage: string;
  onCancelClick: () => void;
};

function FormError(props: FormErrorProps) {
  if (props.errorMessage === "") {
    return <></>;
  } else {
    return (
      <div className="form-error-wrapper">
        <div className="form-error">
          <p className="form-error">{props.errorMessage}</p>
          <button className="form-error-button" onClick={props.onCancelClick}>
            ×
          </button>
        </div>
      </div>
    );
  }
}

export default FormError;
