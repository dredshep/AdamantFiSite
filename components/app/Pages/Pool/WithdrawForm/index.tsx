import FormButton from "@/components/app/Shared/Forms/FormButton";
import PoolTokenInput from "@/components/app/Shared/Forms/Input/PoolTokenInput";
import PoolSelectionModal from "@/components/app/Shared/Forms/Select/PoolSelectionModal";
import { usePoolForm } from "@/hooks/usePoolForm";
import { usePoolStore } from "@/store/forms/poolStore";
import {
  getApiTokenAddress,
  getApiTokenSymbol,
} from "@/utils/apis/getSwappableTokens";
import * as Dialog from "@radix-ui/react-dialog";
import React from "react";

const WithdrawForm: React.FC = () => {
  // const { selectedPool, apr, estimatedLPTokens, handleDepositClick } =
  //   usePoolForm();
  const { selectedPool } = usePoolStore();
  const { handleClick } = usePoolForm(selectedPool?.address);

  if (!selectedPool) {
    return (
      <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-center items-center">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="bg-adamant-primary hover:bg-adamant-primary/90 text-white font-medium py-2 px-4 rounded-lg">
              Select a Pool
            </button>
          </Dialog.Trigger>
          <PoolSelectionModal />
        </Dialog.Root>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-between">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center px-2.5">
          <span className="text-white font-medium">Selected Pool:</span>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="text-adamant-primary hover:text-adamant-primary/90">
                Change
              </button>
            </Dialog.Trigger>
            <PoolSelectionModal />
          </Dialog.Root>
        </div>
        <PoolTokenInput
          poolInputIdentifier={`pool.withdraw.tokenA`}
          token={{
            symbol: getApiTokenSymbol(selectedPool.token0!),
            // balance: Number(selectedPool.token0!.balance),
            address: getApiTokenAddress(selectedPool.token0!),
          }}
          label="Deposit"
        />
        <PoolTokenInput
          poolInputIdentifier={`pool.withdraw.tokenB`}
          token={{
            symbol: getApiTokenSymbol(selectedPool.token1!),
            // balance: Number(selectedPool.token1!.balance),
            address: getApiTokenAddress(selectedPool.token1!),
          }}
          label="And"
        />
        {/* <div className="flex flex-col gap-2 px-2.5 text-gray-400 text-sm">
          <div className="flex justify-between">
            <span>APR:</span>
            <span>{apr}%</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated LP Tokens:</span>
            <span>{estimatedLPTokens}</span>
          </div>
        </div> */}
      </div>
      <FormButton
        onClick={() => handleClick("deposit")}
        text="Provide Liquidity"
      />
    </div>
  );
};

export default WithdrawForm;
