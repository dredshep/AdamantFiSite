import cn from "classnames";

type InputLabelProps = {
  label: string;
  caseType: "uppercase" | "normal-case";
};

export default function InputLabel({ label, caseType }: InputLabelProps) {
  return (
    <label
      className={cn(
        "block text-sm leading-6 font-medium text-white brightness-50 text-[13px],",
        caseType === "uppercase" ? "uppercase" : "normal-case"
      )}
    >
      {label}
    </label>
  );
}
