
import express from "express";
import { getAverageRandomNumber, startFetchingRandomNumbers, stopFetchingRandomNumbers, clearRandomNumbers } from './ controller/randomNumbersAverage';

const app = express();

app.use(express.json())
app.get("/random-numbers-average", getAverageRandomNumber)

export {
  app,
  // The following functions are exported because they are needed for testing.
  clearRandomNumbers,
  startFetchingRandomNumbers,
  stopFetchingRandomNumbers,
}