# Problem Statement
We will be building a service using Node.js. The service must call a target API every second to get a new random number and store the number in the memory of the service. The service must expose a single REST endpoint. When that REST service is called it should return the average of all the random numbers since the service started.

Please include a README.md file which details

	•	Steps to run the service
	•	Steps to run the unit tests
	•	Any design or trade-offs you have made.

# Tips
	•	You can use TypeScript or JavaScript for this; we recommend the one you feel most confident in
	•	You can use any libraries from NPM to support you.
	•	The service should be developed ‘test-first'.
	•	We value simplicity as an architectural virtue and a development practice. Solutions should reflect the difficulty of the assigned task, and shouldn’t be overly complex. We prefer simple, well-tested solutions over clever solutions.
	•	There is no need for data persistence.
	•	There is no need for any authentication on the REST API you build.
	•	Write code you would be proud to provide to a customer.

# Target API details
CSRNG.net offers a lite random number generator API which gives 1 random number a second. Note: we do not want you to use the paid/pro option as we would like to see how you detail the rate-limiting aspects.

To use the API, you can do an HTTP GET to https://csrng.net/csrng/csrng.php?min=0&max=100 which will return you a random number. The documentation for the API is at https://csrng.net/?page_id=43 
Delivery
Please provide a ZIP file of your solution or link to GitHub repository with your solution in it.
