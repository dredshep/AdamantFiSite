import React, { useState, useEffect } from "react";
import { useViewingKeyStore } from "@/store/viewingKeyStore";
import { SecretString } from "@/types";
import { Keplr, Window as KeplrWindow } from "@keplr-wallet/types";
import { FiCheckCircle, FiX, FiArrowLeft } from "react-icons/fi";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Reusable component for Registration and Syncing Buttons
const TokenActionButton: React.FC<{
  action: () => void;
  isActionCompleted: boolean;
  actionText: string;
  completedText: string;
  disabled: boolean;
  tooltipId: string;
  tooltipContent: string;
}> = ({
  action,
  isActionCompleted,
  actionText,
  completedText,
  disabled,
  tooltipId,
  tooltipContent,
}) => (
  <>
    <button
      onClick={action}
      className={`${
        disabled
          ? "bg-gray-400 text-gray-800 cursor-not-allowed"
          : isActionCompleted
          ? "bg-green-500 text-white"
          : "bg-blue-500 hover:bg-blue-700 text-white"
      } font-bold py-2 px-4 rounded-lg w-full mb-2`}
      disabled={disabled || isActionCompleted}
      data-tooltip-id={tooltipId}
    >
      {isActionCompleted ? completedText : actionText}
      {isActionCompleted && <FiCheckCircle className="inline ml-2" />}
    </button>
    <Tooltip id={tooltipId} place="top" content={tooltipContent} />
  </>
);

// Helper function to check sync status
const checkSyncStatus = async (
  tokenAddress: SecretString,
  setRegistered: React.Dispatch<React.SetStateAction<boolean>>,
  setSynced: React.Dispatch<React.SetStateAction<boolean>>,
  getViewingKey: (address: string) => string | undefined
) => {
  try {
    const chainId = process.env["NEXT_PUBLIC_CHAIN_ID"]!;
    if (!window.keplr) return;
    const viewingKey = await (
      window.keplr as unknown as Keplr
    ).getSecret20ViewingKey(chainId, tokenAddress);

    if (viewingKey) {
      setRegistered(true);
      const storedKey = getViewingKey(tokenAddress);
      if (storedKey === viewingKey) {
        setSynced(true);
      }
    }
  } catch (error) {
    console.error("Error checking sync status:", error);
    setRegistered(false);
  }
};

interface ViewingKeyModalProps {
  tokenIn: SecretString;
  tokenOut: SecretString;
  onClose: () => void;
}

// Main Component
const ViewingKeyModal: React.FC<ViewingKeyModalProps> = ({
  tokenIn,
  tokenOut,
  onClose,
}) => {
  const { setViewingKey, getViewingKey } = useViewingKeyStore();
  const [customKey, setCustomKey] = useState<string>("");
  const [showCustomKeyField, setShowCustomKeyField] = useState<boolean>(false);
  const [isInputRegistered, setIsInputRegistered] = useState<boolean>(false);
  const [isOutputRegistered, setIsOutputRegistered] = useState<boolean>(false);
  const [inputKeySynced, setInputKeySynced] = useState<boolean>(false);
  const [outputKeySynced, setOutputKeySynced] = useState<boolean>(false);

  useEffect(() => {
    void checkSyncStatus(
      tokenIn,
      setIsInputRegistered,
      setInputKeySynced,
      getViewingKey
    );
    void checkSyncStatus(
      tokenOut,
      setIsOutputRegistered,
      setOutputKeySynced,
      getViewingKey
    );
  }, [tokenIn, tokenOut, getViewingKey]);

  const handleRegisterToken = async (
    tokenAddress: SecretString,
    setRegistered: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
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
      setRegistered(true);
      alert("Token registration requested.");
    } catch (error) {
      console.error("Error registering token with Keplr:", error);
      alert("Failed to register token.");
    }
  };

  const handleSyncViewingKey = async (
    tokenAddress: SecretString,
    setSynced: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      if (!window.keplr) {
        alert("Keplr extension not detected.");
        return;
      }

      if (!("NEXT_PUBLIC_CHAIN_ID" in process.env)) {
        alert("Chain ID not set in environment.");
        return;
      }

      const chainId = process.env["NEXT_PUBLIC_CHAIN_ID"]!;
      const viewingKey = await (
        window.keplr as unknown as Keplr
      ).getSecret20ViewingKey(chainId, tokenAddress);

      setViewingKey(tokenAddress, viewingKey);
      setSynced(true);
      alert("Viewing key synchronized successfully.");
    } catch (error) {
      console.error("Error fetching viewing key:", error);
      alert(
        "Failed to sync the viewing key. Make sure the token is registered in Keplr."
      );
    }
  };

  const handleSubmitCustomKey = (
    tokenAddress: string,
    setSynced: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (customKey) {
      setViewingKey(tokenAddress, customKey);
      setCustomKey("");
      setShowCustomKeyField(false);
      setSynced(true);
      alert("Viewing key registered successfully.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative bg-adamant-box-veryDark border border-adamant-box-border p-8 rounded-lg shadow-lg max-w-xl w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
        >
          <FiX size={24} />
        </button>

        {/* Modal Header */}
        <h2 className="text-2xl font-bold text-adamant-accentText mb-6 text-center">
          Viewing Key Dashboard
        </h2>

        {!showCustomKeyField ? (
          <>
            {/* Input Token Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-adamant-accentText mb-2">
                Input Token
              </h3>
              <TokenActionButton
                action={() =>
                  void handleRegisterToken(tokenIn, setIsInputRegistered)
                }
                isActionCompleted={isInputRegistered}
                actionText="Register Input Token"
                completedText="Input Token Registered"
                disabled={inputKeySynced}
                tooltipId="inputRegisterTip"
                tooltipContent={
                  isInputRegistered
                    ? "This token is already registered."
                    : "Click to register the input token in Keplr."
                }
              />
              <TokenActionButton
                action={() =>
                  void handleSyncViewingKey(tokenIn, setInputKeySynced)
                }
                isActionCompleted={inputKeySynced}
                actionText="Sync Input Token Key"
                completedText="Input Token Key Synced"
                disabled={!isInputRegistered}
                tooltipId="inputSyncTip"
                tooltipContent={
                  inputKeySynced
                    ? "Viewing key is already synced."
                    : "Click to sync the input token's viewing key."
                }
              />
            </div>

            {/* Output Token Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-adamant-accentText mb-2">
                Output Token
              </h3>
              <TokenActionButton
                action={() =>
                  void handleRegisterToken(tokenOut, setIsOutputRegistered)
                }
                isActionCompleted={isOutputRegistered}
                actionText="Register Output Token"
                completedText="Output Token Registered"
                disabled={outputKeySynced}
                tooltipId="outputRegisterTip"
                tooltipContent={
                  isOutputRegistered
                    ? "This token is already registered."
                    : "Click to register the output token in Keplr."
                }
              />
              <TokenActionButton
                action={() =>
                  void handleSyncViewingKey(tokenOut, setOutputKeySynced)
                }
                isActionCompleted={outputKeySynced}
                actionText="Sync Output Token Key"
                completedText="Output Token Key Synced"
                disabled={!isOutputRegistered}
                tooltipId="outputSyncTip"
                tooltipContent={
                  outputKeySynced
                    ? "Viewing key is already synced."
                    : "Click to sync the output token's viewing key."
                }
              />
            </div>

            {/* Custom Key Section */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">
                If you have a custom viewing key, you can manually enter it
                here.
              </p>
              <button
                onClick={() => setShowCustomKeyField(true)}
                className="bg-adamant-accentBg hover:brightness-90 text-black font-bold py-2 px-4 rounded-lg w-full"
              >
                I Have My Own Key
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setShowCustomKeyField(false)}
              className="flex items-center text-gray-400 hover:text-gray-200 font-bold mb-4"
            >
              <FiArrowLeft className="mr-2" /> Back
            </button>

            {/* Custom Key Input Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-adamant-accentText mb-2">
                Enter Your Viewing Key
              </h3>
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Paste your viewing key"
                className="px-4 py-2 border border-adamant-box-border bg-adamant-app-input rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-adamant-accentBg text-white w-full mb-4"
              />
              <button
                onClick={() =>
                  handleSubmitCustomKey(tokenIn, setInputKeySynced)
                }
                className="bg-adamant-accentBg hover:brightness-90 text-black font-bold py-2 px-4 rounded-lg w-full mb-4"
              >
                Set for Input Token
              </button>
              <button
                onClick={() =>
                  handleSubmitCustomKey(tokenOut, setOutputKeySynced)
                }
                className="bg-adamant-accentBg hover:brightness-90 text-black font-bold py-2 px-4 rounded-lg w-full mb-4"
              >
                Set for Output Token
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewingKeyModal;
