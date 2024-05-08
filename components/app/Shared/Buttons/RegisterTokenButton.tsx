import { SecretString } from "@/types";

type RegisterTokenButtonProps = {
  tokenAddress: SecretString;
};

const RegisterTokenButton = ({ tokenAddress }: RegisterTokenButtonProps) => {
  const handleRegisterToken = async () => {
    try {
      if (!(window as unknown as { keplr: any }).keplr) {
        alert("Keplr extension not detected.");
        return;
      }

      await (window as unknown as { keplr: any }).keplr.suggestToken(
        process.env.NEXT_PUBLIC_CHAIN_ID,
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
      onClick={handleRegisterToken}
    >
      Register Token
    </button>
  );
};

export default RegisterTokenButton;
