import { sendEmail } from '../utils/email.js';

/**
 * Service to orchestrate robust email sending logic.
 */
export const sendContactEmailWithRetry = async (emailData, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await sendEmail(emailData);
      return result; // could be { skipped: true } if unconfigured
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`[Email Service] Failed (attempt ${attempt}/${retries}). Retrying in 2 seconds...`);
      // Wait 2 seconds before retrying to prevent aggressive spamming on down server
      await new Promise(res => setTimeout(res, 2000));
    }
  }
};
