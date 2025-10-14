export interface CreditInfo {
  used: number;
  max: number;
  resetDate: string; // ISO date string
}

export interface UserCredits {
  [userEmail: string]: CreditInfo;
}

const STORAGE_KEY = 'mominai_user_credits';
const MAX_MESSAGES_PER_DAY = 10;

export class CreditService {
  private static getCredits(): UserCredits {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private static saveCredits(credits: UserCredits): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
    } catch (error) {
      console.error('Failed to save credits:', error);
    }
  }

  static getUserCredits(userEmail: string): CreditInfo {
    const credits = this.getCredits();
    const userCredits = credits[userEmail];

    if (!userCredits) {
      // Initialize new user credits
      const resetDate = new Date();
      resetDate.setHours(0, 0, 0, 0); // Start of today
      resetDate.setDate(resetDate.getDate() + 1); // Reset tomorrow

      return {
        used: 0,
        max: MAX_MESSAGES_PER_DAY,
        resetDate: resetDate.toISOString()
      };
    }

    // Check if we need to reset the counter (new day)
    const now = new Date();
    const resetDate = new Date(userCredits.resetDate);

    if (now >= resetDate) {
      // Reset for new day
      const newResetDate = new Date(now);
      newResetDate.setHours(0, 0, 0, 0);
      newResetDate.setDate(newResetDate.getDate() + 1);

      const updatedCredits = {
        ...credits,
        [userEmail]: {
          used: 0,
          max: MAX_MESSAGES_PER_DAY,
          resetDate: newResetDate.toISOString()
        }
      };

      this.saveCredits(updatedCredits);
      return updatedCredits[userEmail];
    }

    return userCredits;
  }

  static useCredit(userEmail: string): boolean {
    const credits = this.getCredits();
    const userCredits = this.getUserCredits(userEmail);

    if (userCredits.used >= userCredits.max) {
      return false; // No credits remaining
    }

    const updatedCredits = {
      ...credits,
      [userEmail]: {
        ...userCredits,
        used: userCredits.used + 1
      }
    };

    this.saveCredits(updatedCredits);
    return true;
  }

  static getRemainingCredits(userEmail: string): number {
    const userCredits = this.getUserCredits(userEmail);
    return Math.max(0, userCredits.max - userCredits.used);
  }

  static getCreditPercentage(userEmail: string): number {
    const userCredits = this.getUserCredits(userEmail);
    return (userCredits.used / userCredits.max) * 100;
  }

  static getResetTime(userEmail: string): Date {
    const userCredits = this.getUserCredits(userEmail);
    return new Date(userCredits.resetDate);
  }

  static resetCredits(userEmail: string): void {
    const credits = this.getCredits();
    const now = new Date();
    const resetDate = new Date(now);
    resetDate.setHours(0, 0, 0, 0);
    resetDate.setDate(resetDate.getDate() + 1);

    const updatedCredits = {
      ...credits,
      [userEmail]: {
        used: 0,
        max: MAX_MESSAGES_PER_DAY,
        resetDate: resetDate.toISOString()
      }
    };

    this.saveCredits(updatedCredits);
  }
}