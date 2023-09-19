import axios from "axios";
import { z } from "zod";
import { combinedResponseSchema } from "./schemas";
import CsrngRandomNumberEndpointError from "./CsrngRandomNumberEndpointError";

// Controls the recursive chain of setTimeout
let shouldContinueFetching = true;

// The in-memory random numbers obtained from the external endpoint
export const randomNumbers: number[] = [];

// How often the random generator endpoint is called.
const FETCH_RANDOM_NUMBER_INTERNAL_MS = 1000;

// The number of seconds to wait when the random generator endpoint returns a Max queries error
const MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS = 2000;

//  The code for Max queries in the last second (https://csrng.net/documentation/csrng-lite/)
const MAX_QUERIES_REACHED_ERROR_CODE = "5";

const delay = (delayInMilliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, delayInMilliseconds));

/**
 * Fetches a random number between 0 and 100 from the csrng.net endpoint.
 */
const fetchRandomNumber = async () => {
  try {
    const response = await axios.get(
      "https://csrng.net/csrng/csrng.php?min=0&max=100"
    );

    // Validate the response using Zod
    const parsedResponse = combinedResponseSchema.parse(response.data);

    if (parsedResponse[0].status === "error") {
      const { code } = parsedResponse[0];
      throw new CsrngRandomNumberEndpointError(code);
    }

    // Success case
    return parsedResponse[0].random;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
    } else {
      console.error("Error fetching random number:", error);
    }
    throw error;
  }
};

/**
 * Recursively fetches random numbers from the external endpoint and stores them in a local buffer.
 *
 * This function gets random numbers from the `fetchRandomNumber` function,
 * which fetches random values from the external endpoint. If fetching is successful, the number is 
 * logged and added to the `randomNumbers` array.
 *
 * In case of a rate-limiting error, the fetching process is temporarily paused for a specified 
 * duration (`MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS`) to comply with the rate limit.
 * After the pause, the fetching process is resumed.
 * 
 * For other errors, the fetching process does not stop, it queues the next fetching process.
 *
 * Note: The function's execution is governed by the `shouldContinueFetching` flag. If the flag is
 * set to false, the fetching process is halted.
 */
export const fetchRandomNumbers = async () => {
  if (!shouldContinueFetching) return;

  try {
    const randomNumber = await fetchRandomNumber();
    console.debug(`Number fetched ${randomNumber}.`);
    randomNumbers.push(randomNumber);

    setTimeout(fetchRandomNumbers, FETCH_RANDOM_NUMBER_INTERNAL_MS);
  } catch (error) {
    if (error instanceof CsrngRandomNumberEndpointError) {
      if (error.message === MAX_QUERIES_REACHED_ERROR_CODE) {

        // Temporarily stop the fetching
        shouldContinueFetching = false;

        // For now we just wait MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS. Check out the README for other alternatives
        await delay(MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS);

        // Restore the flag and restart fetching
        shouldContinueFetching = true;
      } 
      // Do not pause for other errors.
      setTimeout(fetchRandomNumbers, FETCH_RANDOM_NUMBER_INTERNAL_MS);
    }
  }
};

export const setShouldContinueFetching = (shouldFetch: boolean) => {
  shouldContinueFetching = shouldFetch
}

export const clearRandomNumbers = () => {
  randomNumbers.length = 0;
};

export const getAverageRandomNumber = () => {
  const sum = randomNumbers.reduce((a, b) => a + b, 0);
  const average = randomNumbers.length ? sum / randomNumbers.length : 0;
  return average
};
