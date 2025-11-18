import { hash, compare, genSalt } from "bcryptjs";

/**
 * Error class for password-related operations
 */
export class PasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordError";
  }
}

/**
 * Configuration for password hashing
 */
export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 12, // Work factor for bcrypt
} as const;

/**
 * Hashes a password using bcrypt with a secure salt
 * @param password - The plain text password to hash
 * @returns Promise resolving to the hashed password
 * @throws PasswordError if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await genSalt(PASSWORD_CONFIG.SALT_ROUNDS);
    return await hash(password, salt);
  } catch {
    throw new PasswordError("Failed to hash password");
  }
}

/**
 * Verifies a password against a hash
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 * @throws PasswordError if comparison fails
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await compare(plainPassword, hashedPassword);
  } catch {
    throw new PasswordError("Failed to verify password");
  }
}
