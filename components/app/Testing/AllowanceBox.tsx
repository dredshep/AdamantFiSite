import { SecretString } from "@/types";
import React, { useState, useEffect } from "react";
import { SecretNetworkClient, TxResultCode } from "secretjs";

interface AllowanceBoxProps {
  secretjs: SecretNetworkClient;
  tokenAddress: SecretString;
  tokenCodeHash: string;
  spenderAddress: SecretString;
  requiredAmount: string;
  walletAddress: SecretString;
  viewingKey: string;
}

const AllowanceBox: React.FC<AllowanceBoxProps> = ({
  secretjs,
  tokenAddress,
  tokenCodeHash,
  spenderAddress,
  requiredAmount,
  walletAddress,
  viewingKey,
}) => {
  const [currentAllowance, setCurrentAllowance] = useState<number | null>(null);
  const [isAllowanceSufficient, setIsAllowanceSufficient] =
    useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newAllowance, setNewAllowance] = useState<string>("");

  // Fetch current allowance on component mount or when dependencies change
  useEffect(() => {
    const fetchAllowance = async () => {
      try {
        console.log({
          tokenAddress,
          tokenCodeHash,
          spenderAddress,
          walletAddress,
          viewingKey,
        });
        const allowanceResponse = await secretjs.query.snip20.GetAllowance({
          contract: { address: tokenAddress, code_hash: tokenCodeHash },
          owner: walletAddress,
          spender: spenderAddress,
          auth: { key: viewingKey },
        });

        console.log({ allowanceResponse });

        // Extract the allowance amount from the response object
        const allowanceAmount = parseFloat(
          allowanceResponse.allowance.allowance
        );

        setCurrentAllowance(allowanceAmount);

        // Check if the current allowance is sufficient for the swap
        setIsAllowanceSufficient(allowanceAmount >= parseFloat(requiredAmount));
      } catch (error) {
        console.error("Error fetching allowance:", error);
      }
    };

    void fetchAllowance();
  }, [
    secretjs.query.snip20,
    tokenAddress,
    spenderAddress,
    requiredAmount,
    walletAddress,
    viewingKey,
    tokenCodeHash,
  ]);

  // Update the allowance
  const increaseAllowance = async () => {
    try {
      const increaseAllowanceResponse =
        await secretjs.tx.snip20.increaseAllowance(
          {
            sender: walletAddress,
            contract_address: tokenAddress,
            msg: {
              increase_allowance: {
                spender: spenderAddress,
                amount: newAllowance,
              },
            },
          },
          { gasLimit: 200_000 }
        );

      if (increaseAllowanceResponse.code === TxResultCode.Success) {
        alert("Allowance successfully increased!");
        setCurrentAllowance(parseFloat(newAllowance)); // Update state after successful increase
        setIsAllowanceSufficient(true);
        setIsModalOpen(false); // Close modal on success
      } else {
        console.error("Error increasing allowance:", increaseAllowanceResponse);
      }
    } catch (error) {
      console.error("Error during allowance increase:", error);
    }
  };

  return (
    <div className="allowance-box bg-gray-100 p-4 rounded-lg border border-blue-500 shadow-md">
      <h3 className="text-lg font-bold text-gray-700">Allowance Details</h3>
      <div className="mt-2">
        <p className="text-gray-600">
          <strong>Current Allowance:</strong>{" "}
          {currentAllowance !== null ? currentAllowance : "Loading..."} tokens
        </p>
        <p
          className={`text-sm mt-1 ${
            isAllowanceSufficient ? "text-green-600" : "text-red-600"
          }`}
        >
          {isAllowanceSufficient
            ? "Allowance is sufficient for this transaction."
            : "Allowance is insufficient."}
        </p>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 text-white font-bold py-2 px-4 mt-4 rounded-lg hover:bg-blue-600 transition"
      >
        Update Allowance
      </button>

      {isModalOpen && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h4 className="text-lg font-bold text-gray-700 mb-4">
              Update Allowance
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Increase the allowance for the spender to use your tokens.
            </p>

            <input
              type="number"
              value={newAllowance}
              onChange={(e) => setNewAllowance(e.target.value)}
              placeholder="Enter new allowance"
              className="w-full p-2 border border-gray-300 rounded-lg mb-4"
            />

            <button
              onClick={() => void increaseAllowance()}
              className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition w-full"
            >
              Update
            </button>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 text-red-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllowanceBox;
