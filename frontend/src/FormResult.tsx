import FormError from "./FormError";
import FormSuccess from "./FormSuccess";

export type FormResultStatus = "success" | "error" | "none";

type FormResultProps = {
  resultStatus: FormResultStatus;
  resultMessage: string;
  onCancelClick: () => void;
};

function FormResult(props: FormResultProps) {
  switch (props.resultStatus) {
    case "success":
      return <FormSuccess successMessage={props.resultMessage} onCancelClick={props.onCancelClick} />;
    case "error":
      return <FormError errorMessage={props.resultMessage} onCancelClick={props.onCancelClick} />;
    case "none":
      return <></>;
  }
}

export default FormResult;
