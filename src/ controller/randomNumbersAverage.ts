import { Request, Response } from "express";
import { getAverageRandomNumber as getAverageService, clearRandomNumbers as clearRandomNumbersService, startFetchingRandomNumbers as startFetchingService, stopFetchingRandomNumbers as stopFetchingService  } from "../service/randomNumbersAverage";

export const getAverageRandomNumber = (_req: Request, res: Response) => {
  const average = getAverageService()
  res.json({ average });
}

export const startFetchingRandomNumbers = () => startFetchingService()

export const stopFetchingRandomNumbers = () => stopFetchingService()

export const clearRandomNumbers = () => clearRandomNumbersService()