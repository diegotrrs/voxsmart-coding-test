import request from "supertest";
import {
  app,
  fetchRandomNumbers,
  stopFetchingRandomNumbers,
  clearRandomNumbers,
} from "../server";
import { Server } from "http";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { z } from "zod";
import {
  randomNumberErrorResponseSchema,
  randomNumberSuccessResponseSchema,
} from "../service/schemas";
import { setImmediate } from "timers";

type SuccessResponse = z.infer<typeof randomNumberSuccessResponseSchema>[0];
type ErrorResponse = z.infer<typeof randomNumberErrorResponseSchema>[0];

type ResponseQueueItem = [
  responseCode: number,
  (SuccessResponse | ErrorResponse)[],
];

const setupMockResponses = (responses: ResponseQueueItem[]) => {
  const mock = new MockAdapter(axios);

  mock.onGet("https://csrng.net/csrng/csrng.php?min=0&max=100").reply(() => {
    const response = responses.shift();
    if (!response) {
      return [500, { error: "No more mock responses available" }];
    }
    return response;
  });

  return mock;
};

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

  const advanceTimersAndFlushPromises = async (milliseconds: number) => {
    jest.advanceTimersByTime(milliseconds);
    // This is a simple trick to flush promises in NodeJS.
    await new Promise((resolve) => setImmediate(resolve));
  };


  describe("Happy scenario: all calls to external endpoint are successful.", () => {
    beforeEach(() => {
      jest.useFakeTimers();

      // Set up mock responses
      const responsesQueue: ResponseQueueItem[] = [
        [200, [{ status: "success", min: 0, max: 100, random: 50 }]],
        [200, [{ status: "success", min: 0, max: 100, random: 60 }]],
        [200, [{ status: "success", min: 0, max: 100, random: 70 }]],
      ];
      setupMockResponses(responsesQueue);
      fetchRandomNumbers();
    });

    afterEach(() => {
      stopFetchingRandomNumbers();
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("should return the average of all of the random numbers received.", async () => {
      // Simulate setTimeou's callback being triggered twice
      await advanceTimersAndFlushPromises(1000);
      await advanceTimersAndFlushPromises(1000);
      

      const response = await request(app).get("/averageRandomNumbers");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("average");
      expect(response.body.average).toBe(60);
    });
  });

  describe("Scenario with errors: some calls to the external endpoint return an error.", () => {
    beforeEach(() => {
      jest.useFakeTimers();

      // Set up mock responses
      const responsesQueue: ResponseQueueItem[] = [
        [200, [{ status: "success", min: 0, max: 100, random: 50 }]],        
        [200, [{ status: "error", code: "7", reason: "Cannot connect to our database." }]],
        [200, [{ status: "success", min: 0, max: 100, random: 30 }]],
      ];
      setupMockResponses(responsesQueue);
      fetchRandomNumbers();
    });

    afterEach(() => {
      stopFetchingRandomNumbers();
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("should return the average of all of the random numbers received, even when errors (different than rate limiting errors ocurred)", async () => {
      await advanceTimersAndFlushPromises(1000);
      await advanceTimersAndFlushPromises(1000);

      const response = await request(app).get("/averageRandomNumbers");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("average");
      expect(response.body.average).toBe(40);
    });
  });

  describe("Rate limited scenario: External endpoint returns a rate limit error.", () => {
    let mock: MockAdapter;

    beforeEach(() => {
      jest.useFakeTimers();
      
      const responsesQueue: ResponseQueueItem[] = [
        [200, [{ status: "success", min: 0, max: 100, random: 10 }]],
        [200, [{ status: "success", min: 0, max: 100, random: 20 }]],
        [200, [{ status: "error", code: "5", reason: "Reached maximum queries in the last second..." }]],
        [200, [{ status: "success", min: 0, max: 100, random: 30 }]],   
        [200, [{ status: "success", min: 0, max: 100, random: 40 }]],                
      ];

      mock = setupMockResponses(responsesQueue);
  
      fetchRandomNumbers();
    });
  
    afterEach(() => {
      stopFetchingRandomNumbers();
      jest.clearAllTimers();
      jest.useRealTimers();
    });
  
    it("should pause fetching numbers after a rate limit error for the specified duration", async () => {
      await advanceTimersAndFlushPromises(1000);
      await advanceTimersAndFlushPromises(1000);

      expect(mock.history.get.length).toBe(3);

      await advanceTimersAndFlushPromises(2000); // This is the pause defined when the rate limit error happens. 

      await advanceTimersAndFlushPromises(1000);
      await advanceTimersAndFlushPromises(1000);
      
      // Check that the 5 requests were done
      expect(mock.history.get.length).toBe(5);
      
      const response = await request(app).get("/averageRandomNumbers");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("average");
      expect(response.body.average).toBe(25);  
    });
  });
});


