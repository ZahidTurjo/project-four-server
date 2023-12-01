const express = require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const app = express()
const port = process.env.PORT ||5000


const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions))
  app.use(express.json())
  app.use(cookieParser())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.whoa8gp.mongodb.net/?retryWrites=true&w=majority`;

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
    const usersCollection = client.db('stayVista').collection('users')
    const roomCollection = client.db('stayVista').collection('rooms')
  

  //  jwt
  app.post('/jwt', async (req, res) => {
    const user = req.body
   
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1d',
    })
    console.log(token);
    console.log('I need a new jwt', user)
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({ success: true })
  }) 
  // log out
  app.get('/logout', async (req, res) => {
    try {
      res
        .clearCookie('token', {
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
      console.log('Logout successful')
    } catch (err) {
      res.status(500).send(err)
    }
  })

  app.get('/rooms', async(req,res)=>{
    const result=await roomCollection.find().toArray()
    res.send(result)
  })
  app.get('/room/:id', async(req,res)=>{
    const id=req.params.id;
    const query={_id :new ObjectId(id) }
    const result=await roomCollection.findOne(query)
    res.send(result)
  })
// get rooms for host

app.get('/rooms/:email', async(req,res)=>{
  const email =req.params.email;
  const result= await roomCollection.find({'host.email' :email}).toArray()
  res.send(result)
})

// save or modify user
app.put('/users/:email', async (req, res) => {
    const email = req.params.email
    const user = req.body
    const query = { email: email }
    const options = { upsert: true }
    const isExist = await usersCollection.findOne(query)
    console.log('User found?----->', isExist)
    if (isExist) return res.send(isExist)
    const result = await usersCollection.updateOne(
      query,
      {
        $set: { ...user, timestamp: Date.now() },
      },
      options
    )
    res.send(result)
  })
// save a room in database
app.post('/rooms',async(req,res)=>{
  const room=req.body;
  const result= await roomCollection.insertOne(room)
  res.send(result)
})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})