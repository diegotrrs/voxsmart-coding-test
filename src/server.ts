
import express from "express";
import { getAverageRandomNumber, fetchRandomNumbers, stopFetchingRandomNumbers, clearRandomNumbers } from './ controller/averageRandomNumbers';

const app = express();

app.use(express.json())
app.get("/averageRandomNumbers", getAverageRandomNumber)

export {
  app,
  // The following functions are exported because they are needed for testing.
  clearRandomNumbers,
  fetchRandomNumbers,
  stopFetchingRandomNumbers,
}