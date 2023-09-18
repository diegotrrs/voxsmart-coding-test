import axios from "axios";
import { z } from "zod";
import { combinedResponseSchema } from "./schemas";
import CsrngRandomNumberEndpointError from "./CsrngRandomNumberEndpointError";

let fetchInterval: NodeJS.Timeout;

// The in-memory random numbers obtained from the external endpoint
export const randomNumbers: number[] = [];

// How often the random generator endpoint is called.
const FETCH_RANDOM_NUMBER_INTERNAL_MS = 1000;

// The number of seconds to wait when the random generator endpoint returns a Max queries error
const MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS = 1000;

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
 * Schedules repeated executions of a callback every `FETCH_RANDOM_NUMBER_INTERNAL_MS` milliseconds. This callback
 * calls fetchRandomNumber and pushes its response (a random number) into the memory's buffer of random numbers.
 * If fetchRandomNumber returns a rate-limiting issue (code MAX_QUERIES_ERROR_CODE) it clears the interval
 * and waits MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_ERRORS
 */
export const startFetchingRandomNumbers = () => {
  fetchInterval = setInterval(async () => {
    try {
      const randomNumber = await fetchRandomNumber();
      console.debug(`Number fetched ${randomNumber}.`)
      randomNumbers.push(randomNumber);
    } catch (error) {
      if (error instanceof CsrngRandomNumberEndpointError) {
        // Handle the MAXIMUM_QUERIES error by clearing the interval and waiting for N seconds.
        if (error.message === MAX_QUERIES_REACHED_ERROR_CODE) {
          stopFetchingRandomNumbers();
          await delay(MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS);
          startFetchingRandomNumbers(); // Restart the fetching after the delay.
        }
      }
    }
  }, FETCH_RANDOM_NUMBER_INTERNAL_MS);
};

export const stopFetchingRandomNumbers = () => {
  clearInterval(fetchInterval);
};

export const clearRandomNumbers = () => {
  randomNumbers.length = 0;
};

export const getAverageRandomNumber = () => {
  const sum = randomNumbers.reduce((a, b) => a + b, 0);
  const average = randomNumbers.length ? sum / randomNumbers.length : 0;
  return average
};
