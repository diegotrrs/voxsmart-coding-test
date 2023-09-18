
# 1. How to run the server
From the root folder execute:

```
npm run build && npm run start
```

In order to call the endpoint, make a Get request to
```
http://localhost:3000/averageRandomNumbers
```

You can also use the following CURL command

```
curl --location 'http://localhost:3000/averageRandomNumbers'
```

# 2. How to run the tests
From the root folder execute:
```
npm run test
```

# 3. Implementation details

## 3.1 Folder structure
For simplicity, a by-type folder structure was chosen. In more detail:
- **controller**: Responsible for the interaction with Express's Request and Response objects. If there were endpoints that accepted parameters or payload, the validation would take place in the controllers.
- **service**: Contains the business logic.
- **tests**: Houses the tests.

## 3.2 Zod
[Zod](https://zod.dev/) is used to declare and validate schemas. This is handy for validating responses from external endpoints or input from clients. The schemas can be located in `service/schemas.ts`.

## 3.3 Handling of rate-limiting errors
The free [CSRNG Lite API](https://csrng.net/documentation/csrng-lite/) permits generating single random numbers, one at a time, with a limit of one request per second for each client IP address. If the rate limit is exceeded, the error returned has a code of 5. To accommodate this restriction, the current implementation pauses for MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS seconds before attempting another fetch. MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS for now has a value of 1000 ms (1 second), this value might need to be increased with further testing.

Another implementation options include add randomness to the delay or following an Adaptive Backoff approach (doubling the wait time every time a rate-limiting error is received - up to a certain maximum wait time - and resetting the wait time when a success response occurs).

## 3.4 Testing 
The [supertest](https://www.npmjs.com/package/supertest) library is employed to test the `random-numbers-average` endpoint exposed. These tests can be characterized as integration tests since they examine the REST API as a complete unit, rather than specific functions in isolation. The decision to adopt this approach stems from the nature of the requirements; the functions exposed are straightforward (e.g., `getAverageRandomNumber`). The bulk of the logic resides in the function invoked by `setInterval` when the server initializes.

To stabilize and make tests predictable, [Axios Mock Adapter](https://www.npmjs.com/package/axios-mock-adapter) is utilized to mock requests to CSRNG.

## 3.5 Constraints
As the random numbers are retained in memory, the total count of random numbers will be constrained by Node's memory allocation. Although the memory varies depending on the operating system and its version, this limitation is unlikely to pose a problem given the scope and objective of this exercise.

## 3.6 Improvements
- Constants like `MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS` and `FETCH_RANDOM_NUMBER_INTERNAL_MS` could be transferred to an `.env` file.
- A test addressing the rate-limiting error would be beneficial.