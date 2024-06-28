const express = require('express');
const app = express();
const { admin, db } = require('./firebase'); // Đường dẫn đến tệp firebaseConfig.js
const firebase = require('firebase/app');
const cors = require('cors');  // Thêm dòng này
require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBopT9eriwAs8k49DyrvcxCK6iOi2e-E-M",
  authDomain: "jptravelz.firebaseapp.com",
  databaseURL: "https://jptravelz-default-rtdb.firebaseio.com",
  projectId: "jptravelz",
  storageBucket: "jptravelz.appspot.com",
  messagingSenderId: "30414699565",
  appId: "1:30414699565:web:64bf1bb32090de9676cca4"
};

firebase.initializeApp(firebaseConfig);

app.use(express.json());
app.use(cors());

app.post("/signup", async (req, res) => {
  const fullname = req.body.fullname;
  const username = req.body.username;
  const password = req.body.password;

  try {
    // Tạo người dùng với Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: username,
      password: password,
      displayName: fullname,
    });

    // Lưu thông tin người dùng vào Firestore
    await db.collection('users').doc(userRecord.uid).set({
      fullname: fullname,
      username: username,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: "User registered successfully! Please login again!" });
  } catch (error) {
    console.error('Error during user registration:', error); // Thêm dòng này để log chi tiết lỗi
    if (error.code === 'auth/email-already-exists') {
      res.json({ success: false, message: "Username already exists!" });
    } else {
      res.json({ success: false, message: "An error occurred during registration." });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

