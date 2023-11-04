const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const socketio = require('socket.io');
const admin = require("firebase-admin"); // Import Firebase Admin SDK

// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mychat-b309a-default-rtdb.firebaseio.com", // Replace with your Firebase Realtime Database URL
});
const PORT = process.env.PORT || 5000;

// Define your CORS options
// Use the cors middleware to allow requests from your frontend app
app.use(cors({
    origin: 'https://chat-app-psi-flame.vercel.app', // Replace with your frontend app's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization', // Add any additional headers as needed
  }));
  
app.use((req, res, next) => {
    // Set custom headers for Mozilla Firefox
    res.setHeader('Access-Control-Allow-Origin', 'https://chat-app-psi-flame.vercel.app'); // Replace with your frontend app's URL
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  }); 

const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
    const transport = socket.conn.transport.name; // in most cases, "polling"
  
    socket.conn.on("upgrade", () => {
      const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
    });
  });
  
let connectedUsers = 0;
const maxUsers = 144; // Set the maximum number of users

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    if (connectedUsers < maxUsers) {
        connectedUsers++;
        io.emit("user-joined", `User ${connectedUsers} has joined.`);
    } else {
        // Send a message to the client that the limit is reached
        socket.emit("limit-reached", "Chat room is full. The limit is 4 users.");
        socket.disconnect();
    }

    socket.on("send-message", (message) => {
        console.log(message);
        const messagesRef = admin.database().ref("messages");
        const newMessageRef = messagesRef.push();
        newMessageRef.set({
            user: message.user,
            message: message.message,
            time: message.time,
        });

        io.emit("received-message", message);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        connectedUsers--;
    });
});

app.get('/', (req, res) => {
    res.send('<h1>Hello, World</h1>');
  });
  
server.listen(PORT, () => {
   console.log(`🎯 Server is running on PORT: ${PORT}`);
});