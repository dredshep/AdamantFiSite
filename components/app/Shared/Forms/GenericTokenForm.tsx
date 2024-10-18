import React from "react";
import InputLabel from "@/components/app/Shared/Forms/Input/InputLabel";
import TokenInput from "@/components/app/Shared/Forms/Input/TokenInput";
import DynamicField from "@/components/app/Shared/Forms/Input/DynamicField";
import FormButton from "@/components/app/Shared/Forms/FormButton";
import { SharedSettings, TokenInputs } from "@/types"; // Assume these are correctly defined elsewhere

type CaseType = "normal-case" | "uppercase";

interface BaseFieldDefinition {
  label: string;
  caseType: CaseType;
}

interface InputFieldDefinition extends BaseFieldDefinition {
  type: "input";
  identifier: keyof TokenInputs;
  balance: number;
  maxable?: boolean;
}

interface SettingFieldDefinition extends BaseFieldDefinition {
  type: "setting";
  identifier: keyof SharedSettings;
}

type FieldDefinition = InputFieldDefinition | SettingFieldDefinition;

interface ButtonDefinition {
  handler: () => void;
  text: string;
}

interface GenericTokenFormProps {
  fields: FieldDefinition[];
  button: ButtonDefinition;
}

export const GenericTokenForm: React.FC<GenericTokenFormProps> = ({
  fields,
  button,
}) => {
  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col gap-6 px-8">
        {fields.map((field, index) => (
          <div key={index} className="flex flex-col gap-2">
            <InputLabel label={field.label} caseType={field.caseType} />
            {field.type === "input" && (
              <TokenInput
                inputIdentifier={field.identifier} // Directly use the correct type
                // maxable={field.maxable}
                balance={field.balance}
              />
            )}
            {field.type === "setting" && (
              <DynamicField fieldIdentifier={field.identifier} /> // Directly use the correct type
            )}
          </div>
        ))}
      </div>
      <FormButton onClick={button.handler} text={button.text} />
    </div>
  );
};
