// import fs from "fs";
// import path from "path";

// const loadJsonFile = (filePath: string) => {
//   try {
//     const rawdata = fs.readFileSync(filePath, "utf8");
//     return JSON.parse(rawdata);
//   } catch (error) {
//     console.error(`Error reading file from disk: ${error}`);
//     return null;
//   }
// };

// const compareTokens = () => {
//   const secretTokens = loadJsonFile(path.join(__dirname, "secret_tokens.json"));
//   const azureTokens = loadJsonFile(path.join(__dirname, "azure_tokens.json"));
//   const geckoIdMap = loadJsonFile(
//     path.join(__dirname, "secret_gecko_id_map.json")
//   );

//   if (!secretTokens || !azureTokens || !geckoIdMap) {
//     console.error("Failed to load one or more files.");
//     return;
//   }

//   const secretAddresses = new Set(
//     secretTokens.tokens.map((token: any) => token.address)
//   );
//   const geckoLookup = new Map(
//     geckoIdMap.map((item: any) => [item.src_coin, item.id])
//   );

//   const results = azureTokens.tokens.map((token: any) => {
//     const isNotInSecret = !secretAddresses.has(token.dst_address);
//     return {
//       name: token.name,
//       src_coin: token.src_coin,
//       //   dst_address: token.dst_address,
//       //   isNotInSecret,
//       geckoId: geckoLookup.get(token.src_coin) || "N/A",
//     };
//   });

//   const notInSecret = results.filter(
//     (token: { isNotInSecret: boolean; geckoId: string }) => token.isNotInSecret
//   );
//   console.log("Tokens not in Secret Network:");
//   console.table(results);
// };

// compareTokens();
