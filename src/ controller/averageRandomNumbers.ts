import { Request, Response } from "express";
import * as service from '../service/averageRandomNumbers'

export const getAverageRandomNumber = (_req: Request, res: Response) => {
  const average = service.getAverageRandomNumber()
  res.json({ average });
}

export const fetchRandomNumbers = () => { 
  service.setShouldContinueFetching(true)
  service.fetchRandomNumbers()
}

export const stopFetchingRandomNumbers = () => {
  service.setShouldContinueFetching(false)
}

export const clearRandomNumbers = () => service.clearRandomNumbers()