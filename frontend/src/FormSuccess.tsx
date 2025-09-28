import "./Form.css";

type FormSuccessProps = {
  successMessage: string;
  onCancelClick: () => void;
};

function FormSuccess(props: FormSuccessProps) {
  if (props.successMessage === "") {
    return <></>;
  } else {
    return (
      <div className="form-result-wrapper">
        <div className="form-result form-success">
          <p className="form-result">{props.successMessage}</p>
          <button className="form-result-button" onClick={props.onCancelClick}>
            ×
          </button>
        </div>
      </div>
    );
  }
}

export default FormSuccess;
