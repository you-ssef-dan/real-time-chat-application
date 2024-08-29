import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connection from "./config.js";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import http from 'http';
import { Server } from 'socket.io';


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static('public')); 
app.use(express.static(__dirname ));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret:
      "f180a5342e06bcf9f7fccb9fc5e7e0df97d32721f927784b79ad893d3c535856a7a14e29dd5fd308d3aba339b60184ff2dc9b7167602f49d3bbfcf44d6a891f5",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public", "images")); // Ensure this path is correct
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Ensure the filename is generated correctly
  },
});

const upload = multer({ storage: storage });

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html")); // Serve the login.html file
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "signup.html")); // Serve the signup.html file
});

// -------------------   Users   ---------------------->
app.get("/users", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const currentUserEmail = req.session.user.email;

    // Use parameterized query to safely handle the email value
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE email != ?",
      [currentUserEmail]
    );

    if (rows.length === 0) {
      console.log("No users exist");
      return res.status(400).json({ error: "No users exist" });
    }

    // Send the current user and the list of users in the response
    res.status(200).json({
      currentUser: req.session.user,
      users: rows,
    });
  } catch (error) {
    console.log("Error getting data:", error);
    res.status(500).json({ error: "Error getting data" });
  }
});

// -------------------   sign up ---------------------->
app.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const data = {
    firstname: req.body.fname,
    lastname: req.body.lname,
    email: req.body.email,
    password: req.body.password,
    image: `/images/${req.file.filename}`,
  };

  try {
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [data.email]
    );

    if (rows.length > 0) {
      console.log("User already exists");
      return res.status(400).json({ error: "User already exists" });
    }

    const saltRounds = 7;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;
    await connection.query(
      "INSERT INTO users (firstname, lastname, email, password, image) VALUES (?, ?, ?, ?, ?)",
      [data.firstname, data.lastname, data.email, data.password, data.image]
    );
    console.log("Data inserted successfully");
    res.sendFile(path.join(__dirname, "login.html")); // Serve the login.html file
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Error inserting data" });
  }
});

//-------------------------- login ----------------

app.post("/login", async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  try {
    const exist = await user_exists(user);
    if (exist) {
      req.session.user = {
        user_id: exist.user_id,
        firstname: exist.firstname,
        lastname: exist.lastname,
        email: exist.email,
        image: exist.image,
      };
      res.status(200).json({ message: "Success" });
    } else {
      console.log("email or password incorrect");
      res.status(400).json({ error: "email or password incorrect" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Error during login" });
  }
});

// ------------- get chat----------------

app.get("/chat", async (req, res) => {
  const { from, to } = req.query;
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const [messages] = await connection.query(
      `SELECT * FROM messages
             LEFT JOIN users ON users.user_id = messages.outgoing_msg_id
             WHERE (outgoing_msg_id = ? AND incoming_msg_id = ?) 
                OR (incoming_msg_id = ? AND outgoing_msg_id = ? ) ORDER BY time  `, [from, to, from, to] );
    const [incoming_user] = await connection.query(
        'SELECT * FROM users WHERE user_id = ?', [to]
    );

    if (messages.length === 0) {
      console.log("No message exist");
      return res.status(404).json({incoming_user:incoming_user[0],error:'no message exist'});
    }

    // Send the current user and the list of messages in the response
    res.status(200).json({
      currentUser: req.session.user,
      messages: messages,
      incoming_user:incoming_user[0],
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
  res.status(500).json({ error: 'Error fetching chat messages' });
  }
});

//----------post chat 
app.post("/chat", async (req, res) => {
  const { from, to } = req.query;
  const message = {
    msg: req.body.message,
    outgoing_msg_id: from,
    incoming_msg_id: to,
  };
  
  try {
    if (!message.msg || message.msg.trim() === "") {
      return res.status(204).json({ error: "Message cannot be empty" });
    }

    const [incoming_user] = await connection.query(
      'SELECT * FROM users WHERE user_id = ?', [to]
    );
  
    const result = await connection.query(
      "INSERT INTO messages (outgoing_msg_id, incoming_msg_id, msg) VALUES (?, ?, ?)",
      [message.outgoing_msg_id, message.incoming_msg_id, message.msg]
    );
    
    console.log('Message stored in database:', result);

    res.status(200).json({ incoming_user:incoming_user[0],message:message});
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});

  
// Updated user_exists function
async function user_exists(user) {
  const [rows] = await connection.query("SELECT * FROM users WHERE email = ?", [
    user.email,
  ]);
  if (rows.length === 0) {
    return false;
  }
  const isPasswordMatch = await bcrypt.compare(user.password, rows[0].password);
  if (isPasswordMatch) {
    return rows[0]; // Return the user data if the password matches
  } else {
    return false;
  }
}

//----connect and disconnect socket---
io.on('connection', (socket) => {
  console.log('A user connected');


  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('resive_message', (message) => {
    io.emit('sende_message', message); // Broadcast message to all connected clients
});

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port} `);
});

