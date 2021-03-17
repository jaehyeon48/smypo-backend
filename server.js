const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors')
require('dotenv').config();

require('./database/db'); // connect to DB

const app = express();

// handling CORS
app.use(cors({
  origin: /^https?:\/\/www\.smypo\.com*$/,
  // origin: 'https://localhost:3000',
  methods: 'GET,POST,PUT,PATCH,DELETE',
  allowedHeaders: 'Content-Type,X-Requested-With',
  credentials: true,
  maxAge: 3600
}));
app.use(express.json({ extended: false }));
app.use(cookieParser());
app.use('/avatars', express.static(path.join('/avatars')));

app.use('/auth', require('./routes/authRoute'));
app.use('/portfolio', require('./routes/portfolioRoute'));
app.use('/user', require('./routes/userRoute'));
app.use('/stock', require('./routes/stockRoute'));
app.use('/cash', require('./routes/cashRoute'));
app.use('/record', require('./routes/recordRoute'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));