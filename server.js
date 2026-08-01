require('dotenv').config(); // Mengaktifkan pembacaan file .env di awal aplikasi
const app = require('./server/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server ForexHub Aktif di http://127.0.0.1:${PORT}`);
});