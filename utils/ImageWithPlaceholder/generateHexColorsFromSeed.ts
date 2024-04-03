import seedrandom from "seedrandom";

/**
 * Generates an array of hex colors based on a seed.
 *
 * @param seed - The seed used to generate the colors.
 * @param numberOfColors - The number of colors to generate. Default is 3.
 * @returns An array of hex colors.
 */
export default function generateHexColorsFromSeed(
  seed: string,
  numberOfColors: number = 3
): string[] {
  const rng = seedrandom(seed);
  const colors: string[] = [];

  for (let i = 0; i < numberOfColors; i++) {
    // Generate a random color
    let color = Math.floor(rng() * (0xffffff + 1)).toString(16);
    // Pad the string with leading zeros, if necessary, to ensure it has length 6
    color = color.padStart(6, "0");
    colors.push(color);
  }

  return colors;
}
