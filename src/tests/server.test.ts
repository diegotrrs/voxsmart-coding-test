import request from "supertest";
import {
  app,
  startFetchingRandomNumbers,
  stopFetchingRandomNumbers,
  clearRandomNumbers,
} from "../server";
import { Server } from "http";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { randomNumberErrorResponseSchema, randomNumberSuccessResponseSchema } from "../service/random-numbers-average";
import { z } from "zod";

type SuccessResponse = z.infer<typeof randomNumberSuccessResponseSchema>[0];
type ErrorResponse = z.infer<typeof randomNumberErrorResponseSchema>[0];

type ResponseQueueItem = [responseCode: number, (SuccessResponse | ErrorResponse)[]];

const setupMockResponses = (responses : ResponseQueueItem[]) => { 
  const mock = new MockAdapter(axios);

  mock.onGet("https://csrng.net/csrng/csrng.php?min=0&max=100").reply(() => {
    const response = responses.shift();
    if (!response) {
      return [500, { error: "No more mock responses available" }];
    }
    return response;
  });

  return mock
}

describe("Random numbers average endpoint", () => {
    let server: Server;

    beforeEach(() => {
      server = app.listen(4000); // Use a different port that the app
    });
  
    afterEach((done) => {
      server.close(done);

      // Clear the numbers stored in memory after each test
      clearRandomNumbers();      
    });

  describe("Happy scenario: all calls to external endpoint are successful.", () => {
    beforeEach(() => {
      jest.useFakeTimers();
  
      // Set up mock responses      
      const responsesQueue: ResponseQueueItem[] = [
        [200, [{ status: "success", min: 0, max: 100, random: 50 }]],
        [200, [{ status: "success", min: 0, max: 100, random: 60 }]],
        [200, [{ status: "success", min: 0, max: 100, random: 70 }]],
    ];
      setupMockResponses(responsesQueue)
      startFetchingRandomNumbers();
    });
  
    afterEach(() => {
      stopFetchingRandomNumbers();
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("should return the average of all of the random numbers received.", async () => {
      // Forward time by 3 seconds. This will cause the setInterval in startFetching() to be called 3 times.
      jest.advanceTimersByTime(3000);
  
      const response = await request(app).get("/random-numbers-average");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("average");
      expect(response.body.average).toBe(60);
    });
  })

  describe("Scenario with errors: some calls to the external endpoint return an error.", () => {
    let mock;

    beforeEach(() => {
      jest.useFakeTimers();
  
      // Set up mock responses
      mock = new MockAdapter(axios);

      // Set up mock responses
      const responsesQueue: ResponseQueueItem[] = [
        [200, [{ status: "success", min: 0, max: 100, random: 50 }]],
        // The error code is not important in this case
        [200, [{ status: "error", code: "7", reason: "Cannot connect to our database." }]],
        [200, [{ status: "success", min: 0, max: 100, random: 30 }]],
        [200, [{ status: "error", code: "7", reason: "Cannot connect to our database." }]],
      ];

      setupMockResponses(responsesQueue);      
      startFetchingRandomNumbers();
    });
  
    afterEach(() => {
      stopFetchingRandomNumbers();
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("should return the average of all of the random numbers received successfully, ignoring the cases where an exception was triggered", async () => {
      // Forward time by 3 seconds. This will cause the setInterval in startFetching() to be called 3 times.
      jest.advanceTimersByTime(3000);
  
      const response = await request(app).get("/random-numbers-average");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("average");
      expect(response.body.average).toBe(40); // 50 + 30 / 2
    });
  })
});
