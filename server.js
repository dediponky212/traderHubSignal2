require("dotenv").config();
const app = require("./server/app");
const authRoutes = require("./server/routes/authRoutes");
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server ForexHub Aktif di http://127.0.0.1:${PORT}`);
});