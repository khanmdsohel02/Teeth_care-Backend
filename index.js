const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { log } = require("console");

require("dotenv").config();

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

const client = new MongoClient(process.env.MongoDB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const teethCareDB = client.db("TeethCareDB");
    const treatmentsCollection = teethCareDB.collection("treatments");

    // treatmentsCollection Start***********************
    app.post("/treatment", verifyToken, async (req, res) => {
      const treatmentData = req.body;
      const result = await treatmentsCollection.insertOne(treatmentData);
      res.send(result);
    });

    //   app.get("/treatments", async (req, res) => {
    //   try {
    //     const all = "all";
    //     const treatmentName = req.query.name === undefined ? all : req.query.name;
    //     console.log(treatmentName);

    //     let treatmentsData;

    //     if (treatmentName === all) {
    //       treatmentsData = treatmentsCollection.find();
    //     } else {
    //       const filter = treatmentName ? { name: treatmentName.trim() } : {};
    //       treatmentsData = treatmentsCollection.find(filter);
    //     }

    //     const result = await treatmentsData.toArray();
    //     res.send(result);

    //   } catch (error) {
    //     console.error("Error fetching treatments:", error);
    //     res.status(500).send("An error occurred while fetching treatments.");
    //   }
    // });

    app.get("/treatments", async (req, res) => {
      try {
        const all = "all";
        const treatmentName =
          req.query.name === undefined ? all : req.query.name;
        console.log(treatmentName);

        let treatmentsData;

        if (treatmentName === all) {
          treatmentsData = treatmentsCollection.find();
        } else {
          const filter = treatmentName ? { name: treatmentName.trim() } : {};
          treatmentsData = treatmentsCollection.find(filter);
          console.log(filter);
        }

        const result = await treatmentsData.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching treatments:", error);
        res.status(500).send("An error occurred while fetching treatments.");
      }
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

    // treatmentsCollection End*********************

    //Appointment Collection Start********************

    const appointmentsCollection = teethCareDB.collection("appointments");

    app.post("/appointment", verifyToken, async (req, res) => {
      const appointmentData = req.body;
      const treatment = appointmentData.treatment;
      const isUserExist = await appointmentsCollection.findOne({
        treatment: treatment,
      });
      if (isUserExist?._id) {
        return res.send({
          message: `Already You Have ${treatment} Appointment! Teeth Care`,
        });
      }
      const result = await appointmentsCollection.insertOne(appointmentData);
      res.send(result);
    });

    app.get("/appointments", async (req, res) => {
      const appointmentsData = appointmentsCollection.find();
      const result = await appointmentsData.toArray();
      res.send(result);
    });

    app.delete("/appointment/:id", verifyToken, async (req, res) => {
      const query = req.params.id;
      const result = await appointmentsCollection.deleteOne({
        _id: new ObjectId(query),
      });
      res.send(result);
    });

    app.put("/appointment/:id", verifyToken, async (req, res) => {
      const query = req.params.id;
      const appointmentData = req.body;
      const result = await appointmentsCollection.updateOne(
        { _id: new ObjectId(query) },
        {
          $set: appointmentData,
        }
      );
      res.send(result);
    });
    //Appointment Collection End********************

    // usersCollection Start***************************

    const usersCollection = teethCareDB.collection("users");

    app.post("/users", async (req, res) => {
      const userData = req.body;
      const token = createToken(userData);
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
      const result = await usersCollection.findOne({
        email: query,
      });
      res.send(result);
    });

    app.put("/users/:email", async (req, res) => {
      const query = req.params.email;
      const { newPassword } = req.body;
      const result = await usersCollection.updateOne(
        {
          email: query,
        },
        {
          $set: { password: newPassword },
        }
      );
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = usersCollection.find();
      const result = await users.toArray();
      res.send(result);
    });

    // usersCollection End****************

    // blogsCollection Start*********************

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

    // blogsCollection End*********************

    // reviewsCollection start***********************

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

    // reviewsCollection End**************************

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
