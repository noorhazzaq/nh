const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Sambungan MongoDB Railway berjaya"))
.catch(err => console.error("Gagal sambung MongoDB:", err));