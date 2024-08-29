import mysql from 'mysql2/promise';
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'real-time-chat'
});

try {
    console.log('Connected to MySQL as id ' + connection.threadId);
} catch (error) {
    console.error('Error connecting to MySQL:', err.stack);
}
  export default connection; 