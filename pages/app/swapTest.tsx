// Import necessary hooks and components
import SwapForm from "@/components/app/Pages/Swap/SwapForm/SwapForm";
import AppLayout from "@/components/app/Global/AppLayout";
import TwoTokenFormBox from "@/components/app/Shared/Forms/TwoTokenFormBox";

interface Tab {
  label: string;
  Component: React.FC;
}

const FormLayout: React.FC = () => {
  const tabs: Tab[] = [
    { label: "SWAP", Component: SwapForm },
    { label: "SEND", Component: SwapForm },
  ];

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto mt-28">
        <TwoTokenFormBox tabs={tabs} liquidityPrompt={true} />
      </div>
    </AppLayout>
  );
};

export default FormLayout;
