require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');

const port = process.env.PORT || 3000;

const app = express();
app.use(cors())
app.use(express())
app.use(express.json())


const admin = require("firebase-admin");
// const serviceAccount = require("./firebase-admin-key.json");

const decoded = Buffer.from(process.env.FB_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  console.log(token);
  

  if (!token) {
    return res.status(401).send({ message: 'Unauthorize access' })
  }
  try {
    
    const decoded = await admin.auth().verifyIdToken(token)
    console.log("decoded Information", decoded);
    req.decoded_email = decoded.email;
    next();

  }
  catch (error) {
    return res.status(401).send({ message: 'Unauthorize access' })
  }
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sctb0kd.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db('bookCurier_Library')
    const userCollections = database.collection('user')
    const booksCollections = database.collection('books')
    const ordersCollections = database.collection('orders')

    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      userInfo.createdAt = new Date();

      const result = await userCollections.insertOne(userInfo);
      res.send(result);
    });


    app.post('/books', async (req, res) => {
      const bookInfo = req.body;
      bookInfo.createdAt = new Date();
      const result = await booksCollections.insertOne(bookInfo);
      res.send(result);
    });


    app.get('/users/role/:email', async (req, res) => {
      const { email } = req.params

      const query = { email: email }
      const result = await userCollections.findOne(query)
      // console.log(result)
      res.send(result)
    })
    app.get('/books/:email', async (req, res) => {
      const { email } = req.params
      const query = { email: email }
      const result = await booksCollections.find(query).toArray()
      //console.log(result)
      res.send(result)
    })
    app.get('/orders/:email', async (req, res) => {
      const { email } = req.params
      const query = { email: email }
      const result = await ordersCollections.find(query).toArray()
      //console.log(result)
      res.send(result)
    })
    app.get('/books', async (req, res) => {
      const result = await booksCollections.find().toArray()
      console.log(result)
      res.send(result)
    })
    app.get('/books/id/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) }; // Use _id and wrap the string in ObjectId
      const result = await booksCollections.findOne(query);
      res.send(result);
    });

    app.post('/orders', async(req,res)=>{
      const orderInfo = req.body;
      orderInfo.createdAt = new Date();
      const result = await ordersCollections.insertOne(orderInfo);
      res.send(result);
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("Hello Form BookCurier Library Server")
})

app.listen(port, () => {
  console.log(`Server is running on Port: ${port}`);

})