export const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

export const debugLog = (message: string, ...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log(message, ...args);
  }
};
