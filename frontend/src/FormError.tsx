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
      <div className="form-result-wrapper">
        <div className="form-result">
          <p className="form-result form-error">{props.errorMessage}</p>
          <button className="form-result-button" onClick={props.onCancelClick}>
            ×
          </button>
        </div>
      </div>
    );
  }
}

export default FormError;
