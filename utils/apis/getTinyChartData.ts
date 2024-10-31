// interface ChartValue {
//   time: number;
//   value: number;
// }

// // Mock function to simulate fetching chart data based on a token address
// export const getTinyChartData = async (
//   tokenAddress: string
// ): Promise<ChartValue[]> => {
//   // Define mock data for different tokens
//   const data: Record<string, ChartValue[]> = {
//     secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek: [
//       // Slight upward trend
//       { time: 1, value: 50 },
//       { time: 2, value: 52 },
//       { time: 3, value: 51 },
//       { time: 4, value: 53 },
//     ],
//     secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt: [
//       // Slight downward trend
//       { time: 1, value: 50 },
//       { time: 2, value: 49 },
//       { time: 3, value: 50 },
//       { time: 4, value: 48 },
//     ],
//     secret1yxwnyk8htvvq25x2z87yj0r5tqpev452fk6h5h: [
//       // Dramatic changes
//       { time: 1, value: 50 },
//       { time: 2, value: 60 },
//       { time: 3, value: 40 },
//       { time: 4, value: 65 },
//     ],
//   };

//   // Simulate fetching data by returning the mock data for the requested token address
//   // If the token address is not found, return an empty array
//   return data[tokenAddress] || [];
// };
