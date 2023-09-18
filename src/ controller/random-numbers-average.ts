import { Request, Response } from "express";
import { getAverage as getAverageService  } from "../service/random-numbers-average";

export const getAverage = (_req: Request, res: Response) => {
  const average = getAverageService()
  res.json({ average });
}