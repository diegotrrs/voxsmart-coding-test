import axios from "axios";
import { z } from "zod";

let fetchInterval: NodeJS.Timeout;

export const randomNumbers: number[] = [];

export const randomNumberSuccessResponseSchema = z.array(
  z.object({
    status: z.literal("success"),
    min: z.number(),
    max: z.number(),
    random: z.number(),
  })
);

export const randomNumberErrorResponseSchema = z.array(
  z.object({
    status: z.literal("error"),
    code: z.string(),
    reason: z.string(),
  })
);

const combinedSchema = z.union([randomNumberSuccessResponseSchema, randomNumberErrorResponseSchema]);

const FETCH_RANDOM_NUMBER_INTERNAL_MS = 1000;

const fetchRandomNumber = async () => {
  try {
    const response = await axios.get(
      "https://csrng.net/csrng/csrng.php?min=0&max=100"
    );

    console.log('>>>>>>>>> response.data >>>>>')
    console.log(response.data)
    // Validate the response using Zod

    const parsedResponse = combinedSchema.parse(response.data);

    if (parsedResponse[0].status === "error") {
      const { reason, code } = parsedResponse[0]
      console.error("API Error:", reason);
      throw new Error(reason);
    } 
    
    // Success case
    return parsedResponse[0].random;

  } catch (error) {
    console.log('>>> error', error)
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
    } else {
      console.error("Error fetching random number:", error);
    }
    throw error;
  }
};

export const startFetchingRandomNumbers = () => {
  fetchInterval = setInterval(async () => {
    try {
      const randomNumber = await fetchRandomNumber();
      randomNumbers.push(randomNumber);
      console.log("Fetched random number:", randomNumber);
    } catch (error) {
      console.error("Error in fetching number:", error);
    }
  }, FETCH_RANDOM_NUMBER_INTERNAL_MS);
};

export const stopFetchingRandomNumbers = () => {
  clearInterval(fetchInterval);
};

export const clearRandomNumbers = () => {
  randomNumbers.length = 0
}

export const getAverageRandomNumber = () => {
  const sum = randomNumbers.reduce((a, b) => a + b, 0);
  const average = randomNumbers.length ? sum / randomNumbers.length : 0;
  return average;
};
