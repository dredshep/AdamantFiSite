import useGlobalConfigStore from "@/store/useGlobalConfigStore";
import { NETWORKS } from "../../../types/NETWORKS";

export const swapContractAddress = (network: NETWORKS): string => {
  const {
    SCRT_SWAP_CONTRACT,
    BSC_SCRT_SWAP_CONTRACT,
    PLSM_SWAP_CONTRACT,
  } = useGlobalConfigStore.getState().config;

  switch (network) {
    case NETWORKS.ETH:
      return SCRT_SWAP_CONTRACT;
    case NETWORKS.BSC:
      return BSC_SCRT_SWAP_CONTRACT;
    case NETWORKS.PLSM:
      return PLSM_SWAP_CONTRACT;
  }
};
