import { SecretString } from "@/types";
import { Window as KeplrWindow } from "@keplr-wallet/types";

type RegisterTokenButtonProps = {
  tokenAddress: SecretString;
};

const RegisterTokenButton = ({ tokenAddress }: RegisterTokenButtonProps) => {
  const handleRegisterToken = async () => {
    try {
      if (!(window as unknown as KeplrWindow).keplr) {
        alert("Keplr extension not detected.");
        return;
      }
      if (!("NEXT_PUBLIC_CHAIN_ID" in process.env)) {
        alert("Chain ID not set in environment.");
        return;
      }

      await (window as unknown as KeplrWindow).keplr!.suggestToken(
        process.env["NEXT_PUBLIC_CHAIN_ID"]!,
        tokenAddress
      );
      alert("Token registration requested.");
    } catch (error) {
      console.error("Error registering token with Keplr:", error);
      alert("Failed to register token.");
    }
  };

  return (
    <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={() => void handleRegisterToken()}
    >
      Register Token
    </button>
  );
};

export default RegisterTokenButton;
