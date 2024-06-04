const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { log } = require("console");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const createToken = (user) => {
  const token = jwt.sign({ email: user.email }, "secret", { expiresIn: "10h" });
  return token;
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, "secret", function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    const email = decoded.email;
    if (email) req.user = email;
    next();
  });
};

const uri =
  "mongodb+srv://teethcarebackend:teethcarebackend25@cluster0.sijewxb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    const teethCareDB = client.db("TeethCareDB");
    const treatmentsCollection = teethCareDB.collection("treatments");

    // treatmentsCollection Start
    app.post("/treatment", verifyToken, async (req, res) => {
      const treatmentData = req.body;
      const result = await treatmentsCollection.insertOne(treatmentData);
      res.send(result);
    });

    app.get("/treatments", async (req, res) => {
      const treatmentsData = treatmentsCollection.find();
      const result = await treatmentsData.toArray();

      res.send(result);
    });

    app.delete("/treatment/:id", verifyToken, async (req, res) => {
      const query = req.params.id;
      const result = await treatmentsCollection.deleteOne({
        _id: new ObjectId(query),
      });

      res.send(result);
    });

    app.get("/treatment/:id", async (req, res) => {
      const query = req.params.id;
      const result = await treatmentsCollection.findOne({
        _id: new ObjectId(query),
      });

      res.send(result);
    });

    app.patch("/treatment/:id", verifyToken, async (req, res) => {
      const query = req.params.id;
      const treatmentData = req.body;
      const result = await treatmentsCollection.updateOne(
        { _id: new ObjectId(query) },
        {
          $set: treatmentData,
        }
      );

      res.send(result);
    });

    // treatmentsCollection End

    //Appointment Collection Start
    const appointmentsCollection = teethCareDB.collection("appointments");

    app.post("/appointment", async (req, res) => {
      const appointmentData = req.body;
      const isUserExist = await appointmentsCollection.findOne({
        email: appointmentData.patientEmail,
        treatment: appointmentData.treatment,
      });
      if (isUserExist?._id) {
        return res.send({
          message: "Already You Have An Appointment! Teeth Care",
          token,
        });
      }
      const result = await appointmentsCollection.insertOne(appointmentData);
      res.send({ result, token });
    });

    app.get("/appointments", async (req, res) => {
      const appointmentsData = appointmentsCollection.find();
      const result = await appointmentsData.toArray();

      res.send(result);
    });

    // usersCollection Start

    const usersCollection = teethCareDB.collection("users");

    app.post("/users", async (req, res) => {
      const userData = req.body;
      const token = createToken(userData);
      console.log(token);
      const isUserExist = await usersCollection.findOne({
        email: userData.email,
      });
      if (isUserExist?._id) {
        return res.send({
          status: "User Successfully Login",
          message: "Welcome Back! Teeth Care",
          token,
        });
      }

      const result = await usersCollection.insertOne(userData);
      res.send({ result, token });
    });

    app.put("/update-user/:email", verifyToken, async (req, res) => {
      const query = req.params.email;
      const userUpdatedData = req.body;
      console.log(userUpdatedData, query);
      const result = await usersCollection.updateOne(
        {
          email: query,
        },
        {
          $set: userUpdatedData,
        }
      );

      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const query = req.params.email;
      console.log(query);
      const result = await usersCollection.findOne({
        email: query,
      });

      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = usersCollection.find();
      const result = await users.toArray();

      res.send(result);
    });

    // usersCollection End

    // blogsCollection Start

    const blogsCollection = teethCareDB.collection("blogs");

    app.post("/blog", verifyToken, async (req, res) => {
      const blogData = req.body;
      const result = await blogsCollection.insertOne(blogData);
      res.send(result);
    });

    app.get("/blogs", async (req, res) => {
      const blogsData = blogsCollection.find();
      const result = await blogsData.toArray();

      res.send(result);
    });

    // blogsCollection End

    // reviewsCollection start

    const reviewsCollection = teethCareDB.collection("reviews");

    app.post("/review", verifyToken, async (req, res) => {
      const reviewData = req.body;
      const result = await reviewsCollection.insertOne(reviewData);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const reviewsData = reviewsCollection.find();
      const result = await reviewsData.toArray();

      res.send(result);
    });

    // reviewsCollection End

    app.get("/", (req, res) => {
      res.send("Assalamu Alaikum Developers!");
    });

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// teethcarebackend;

// teethcarebackend25;
