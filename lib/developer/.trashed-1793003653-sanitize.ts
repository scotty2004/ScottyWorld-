const MAX_INPUT = 100_000;

export function validateToolInput(input: unknown) {
  if (typeof input !== "string") throw new Error("Input must be text.");
  if (input.length > MAX_INPUT) throw new Error("Input is too large.");
  return input;
}
