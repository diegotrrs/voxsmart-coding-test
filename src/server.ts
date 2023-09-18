
import express from "express";
import { getAverage } from './ controller/random-numbers-average';

const app = express();

app.use(express.json())
app.get("/random-numbers-average", getAverage)

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

export default app