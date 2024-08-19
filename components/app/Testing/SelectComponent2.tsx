import React, { useState, useEffect } from "react";
import fullPoolsData from "@/outputs/fullPoolsData.json";
import { fetchTokenData, getTokenName } from "@/utils/apis/tokenInfo";

interface SelectComponentProps {
  apiUrl?: string;
  setFrom?: (from: string) => void;
  setTo?: (to: string) => void;
  outputOptions?: string[]; // New prop for filtered output options
}

const SelectComponent2: React.FC<SelectComponentProps> = ({
  apiUrl = "/api/tokens",
  setFrom,
  setTo,
  outputOptions = [], // Default to empty array if not provided
}) => {
  const [fromTokens, setFromTokens] = useState<string[]>([]);
  const [toTokens, setToTokens] = useState<string[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<string>("");
  const [selectedTo, setSelectedTo] = useState<string>("");
  const [tokenNames, setTokenNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (setFrom) {
      setFrom(selectedFrom);
    }
    if (setTo) {
      setTo(selectedTo);
    }
  }, [selectedFrom, selectedTo, setFrom, setTo]);

  useEffect(() => {
    const fetchAndSetTokenData = async () => {
      await fetchTokenData(apiUrl);

      const names = fullPoolsData
        .flatMap((pool) => pool.query_result.assets)
        .map((asset) => {
          const address =
            asset.info.token?.contract_addr || asset.info.native_token?.denom;
          return address ? [address, getTokenName(address) || ""] : null;
        })
        .filter((item): item is [string, string] => item !== null)
        .reduce((acc, [address, name]) => {
          acc[address] = name;
          return acc;
        }, {} as { [key: string]: string });

      setTokenNames(names);

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
        .filter((address) => address !== "uscrt");

      setFromTokens(Array.from(new Set(fromOptions)));
    };

    fetchAndSetTokenData();
  }, [apiUrl]);

  const handleFromSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fromToken = event.target.value;
    setSelectedFrom(fromToken);

    if (outputOptions.length > 0) {
      setToTokens(outputOptions);
    } else {
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

      setToTokens(Array.from(new Set(toOptions)));
    }

    setSelectedTo(""); // Reset the selected 'to' token
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
              {tokenNames[address] ?? JSON.stringify(address)}
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

export default SelectComponent2;
