
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

## 3.3 Axios
[Axios](https://axios-http.com/docs/intro) was chosen instead of node-fetch because it's a mature library with built-in JSON support and mainly because of its seamless integration with [Axios Mock Adapter](https://www.npmjs.com/package/axios-mock-adapter), the request mock library chosen. If node-fetch or if [Node.18's fetch](https://nodejs.org/en/blog/announcements/v18-release-announce#fetch-experimental) would be required then the [Mock Service Worker library](https://mswjs.io/docs/getting-started/mocks/rest-api) would be a better option for mocking requests.

## 3.4 Handling of rate-limiting errors
The free [CSRNG Lite API](https://csrng.net/documentation/csrng-lite/) allows users to generate individual random numbers one at a time. It has a rate limit of one request per second for each client IP address. If a client exceeds this limit, an error with a code of 5 is returned.

To manage this limitation, the current implementation will pause for a duration specified by the MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS variable before trying another request. Currently, this value is set at 1000 ms (1 second). Based on further testing, it might be necessary to adjust this duration.

We adopted this method because the CSRNG's response does not include a 'retry-after' header for scenarios like these.

Other potential implementation strategies could involve adding randomness to the delay or implementing an Adaptive Backoff approach. The latter would mean doubling the wait time after each rate-limiting error (up to a predetermined maximum) and then resetting the wait time following a successful response.

## 3.5 Testing 
The [supertest](https://www.npmjs.com/package/supertest) library is employed to test the `random-numbers-average` endpoint exposed. These tests can be characterized as integration tests since they examine the REST API as a complete unit, rather than specific functions in isolation. The decision to adopt this approach stems from the nature of the requirements; the functions exposed are straightforward (e.g., `getAverageRandomNumber`). The bulk of the logic resides in the function invoked by `setInterval` when the server initializes.

To stabilize and make tests predictable, [Axios Mock Adapter](https://www.npmjs.com/package/axios-mock-adapter) is utilized to mock requests to CSRNG.

Notice that the ``startFetchingRandomNumbers, stopFetchingRandomNumbers, clearRandomNumbers`` functions from the service are accessed by the testing code in order to make the each test case independent and isolated for each other.

## 3.6 Constraints
As the random numbers are retained in memory, the total count of random numbers will be constrained by Node's memory allocation. Although the memory varies depending on the operating system and its version, this limitation is unlikely to pose a problem given the scope and objective of this exercise.

## 3.7 Improvements
- Constants like `MILLISECONDS_TO_WAIT_FOR_MAX_QUERIES_REACHED_ERRORS` and `FETCH_RANDOM_NUMBER_INTERNAL_MS` could be transferred to an `.env` file.
- A test addressing the rate-limiting error would be beneficial.
- The code could check if the [retry-after](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header is present as a header in the response on a rate limited issue. 