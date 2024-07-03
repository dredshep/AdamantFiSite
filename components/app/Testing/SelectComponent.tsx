import React, { useState, useEffect, useCallback } from "react";
import fullPoolsData from "@/outputs/fullPoolsData.json";
import { fetchTokenData, getTokenName } from "@/utils/apis/tokenInfo";

const SelectComponent = ({
  apiUrl = "http://localhost:3000/api/tokens",
  setFrom,
  setTo,
}: {
  apiUrl?: string;
  setFrom?: (from: string) => void;
  setTo?: (to: string) => void;
}) => {
  const [fromTokens, setFromTokens] = useState<string[]>([]);
  const [toTokens, setToTokens] = useState<string[]>([]);
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [tokenNames, setTokenNames] = useState<{ [key: string]: string }>({});

  // on change run the func
  useEffect(() => {
    // if (onChange) {
    //   onChange(selectedFrom, selectedTo);
    // }
    if (setFrom) {
      setFrom(selectedFrom);
    }
    if (setTo) {
      setTo(selectedTo);
    }
  }, [selectedFrom, selectedTo, setFrom, setTo]);

  const pools = fullPoolsData;
  //   const poolAddresses = pools.map((pool) => pool.contract_address);
  const findToOptions = useCallback(
    (fromAddress: string) => {
      return pools
        .filter((pool) =>
          pool.query_result.assets.some((asset) => {
            const address =
              asset.info.token?.contract_addr || asset.info.native_token?.denom;
            return address === fromAddress;
          })
        )
        .flatMap((pool) =>
          pool.query_result.assets.filter((asset) => {
            const address =
              asset.info.token?.contract_addr || asset.info.native_token?.denom;
            return address !== fromAddress && typeof address === "string";
          })
        );
    },
    [pools]
  );
  useEffect(() => {
    const toOptions = findToOptions(selectedFrom);
    const toAddresses = toOptions.map(
      (asset) =>
        asset.info.token?.contract_addr ||
        asset.info.native_token?.denom ||
        "not found"
    );
    setToTokens(toAddresses);
    console.log(
      JSON.stringify(
        {
          fromName: tokenNames[selectedFrom],
          fromAddress: selectedFrom,
          toAddresses,
        },
        null,
        2
      )
    );
  }, [selectedFrom, findToOptions, tokenNames, selectedTo]);

  // Fetch and set token data on component mount
  useEffect(() => {
    const fetchAndSetTokenData = async () => {
      // Fetch token data from the API
      await fetchTokenData(apiUrl);

      // Extract token names from the fullPoolsData array
      const names = fullPoolsData
        // Flatten the array of assets in each pool
        .flatMap((pool) => pool.query_result.assets)
        .map((asset) => {
          const address =
            asset.info.token?.contract_addr || asset.info.native_token?.denom;
          // Map each asset to [address, name] pair or null
          return address ? [address, getTokenName(address) || ""] : null;
        })
        // Filter out null values
        .filter((item): item is [string, string] => item !== null)
        // Convert the array of [address, name] pairs into an object { address: name }
        .reduce((acc, [address, name]) => {
          acc[address] = name;
          return acc;
        }, {} as { [key: string]: string });

      // Set the token names state
      setTokenNames(names);

      // Set the "from" tokens state
      const fromOptions = fullPoolsData
        .flatMap((pool) => pool.query_result.assets)
        .map(
          (asset) =>
            asset.info.token?.contract_addr || asset.info.native_token?.denom
        )
        .filter(
          (addressOrDenom): addressOrDenom is string =>
            addressOrDenom !== undefined
        )
        .filter((address) => {
          return address !== "uscrt";
        });

      setFromTokens(Array.from(new Set(fromOptions)));
    };

    fetchAndSetTokenData();
  }, [apiUrl]);

  const handleFromSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fromToken = event.target.value;
    setSelectedFrom(fromToken);

    const toOptions = fullPoolsData
      .filter((pool) =>
        pool.query_result.assets.some(
          (asset) =>
            asset.info.token?.contract_addr === fromToken ||
            asset.info.native_token?.denom === fromToken
        )
      )
      .flatMap((pool) =>
        pool.query_result.assets.map((asset) => {
          const addr =
            asset.info.token?.contract_addr || asset.info.native_token?.denom;
          return addr && addr !== fromToken && tokenNames[addr] ? addr : null;
        })
      )
      .filter((addr): addr is string => addr !== null)
      .filter((addr) => addr !== "uscrt");

    // setToTokens(Array.from(new Set(toOptions)));
    setSelectedTo(""); // Reset the selected 'to' token
    console.log({
      inputFrom: fromToken,
      from: tokenNames[selectedFrom],
      to: tokenNames[event.target.value],
      toOptions,
    });
  };

  const handleToSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTo(event.target.value);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-white">Select From</label>
        <select
          value={selectedFrom}
          onChange={handleFromSelect}
          className="px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-adamant-app-selectTrigger focus:ring-adamant-accentBg text-white"
        >
          <option value="">Select From</option>
          {fromTokens.map((address) => (
            <option key={address} value={address}>
              {tokenNames[address] ?? JSON.stringify(address ?? "asdasd")}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col space-y-2">
        <label className="text-white">Select To</label>
        <select
          disabled={!selectedFrom}
          value={selectedTo}
          onChange={handleToSelect}
          className="px-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 bg-adamant-app-selectTrigger focus:ring-adamant-accentBg text-white"
        >
          <option value="">Select To</option>
          {toTokens.map((address) => (
            <option key={address} value={address}>
              {tokenNames[address] ?? JSON.stringify(address)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectComponent;
