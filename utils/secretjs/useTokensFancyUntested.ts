// import { useEffect, useState } from "react";
// import { getTableTokens } from "@/utils/apis/getTableTokens";
// import { TableToken } from "@/types";

// export function useTokens(chainId: string) {
//   const [tokens, setTokens] = useState<TableToken[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);

//   useEffect(() => {
//     let isMounted = true; // Prevents setting state on unmounted component
//     setIsLoading(true);
//     setError(null);

//     const fetchTokens = async () => {
//       try {
//         const tokensData = await getTableTokens();
//         if (isMounted) {
//           setTokens(tokensData);
//           setIsLoading(false);
//         }
//       } catch (error) {
//         if (isMounted) {
//           console.error("Failed to fetch tokens:", error);
//           setError(error as Error);
//           setIsLoading(false);
//         }
//       }
//     };

//     void fetchTokens();

//     return () => {
//       isMounted = false;
//     }; // Cleanup function to set isMounted false when the component unmounts
//   }, []);

//   useEffect(() => {
//     let isMounted = true;
//     const enableKeplr = async () => {
//       try {
//         if (!window.keplr) {
//           throw new Error("Keplr extension not installed");
//         }
//         await window.keplr.enable(chainId);
//       } catch (keplrError) {
//         if (isMounted) {
//           console.error("Keplr enable error:", keplrError);
//           setError(keplrError as Error);
//         }
//       }
//     };

//     void enableKeplr();

//     return () => {
//       isMounted = false;
//     };
//   }, [chainId]);

//   return { tokens, isLoading, error };
// }
