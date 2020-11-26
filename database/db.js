// let connection;

// async function handleConnectDB() {
//   connection = await mysql.createConnection(db_config);

//   connection.connect((err) => {
//     if (err) {
//       console.log('error when connecting to db:', err);
//       setTimeout(handleConnectDB, 2000);
//     }
//     console.log('Mysql Database Connected...');
//   });
//   connection.on('error', (err) => {
//     console.log('db error', err);
//     if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//       handleConnectDB();
//     }
//     else {
//       throw err;
//     }
//   });
// }

// handleConnectDB();

// module.exports = connection;

const mysql = require('mysql2');
require('dotenv').config();

const db_config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true
};


const pool = mysql.createPool(db_config);

module.exports = pool.promise();