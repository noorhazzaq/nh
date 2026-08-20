const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Replace with your actual GitHub Pages URL after deployment
app.use(cors());

app.get('/api/thank-you', (req, res) => {
  res.json({
    message: "Thank you for visiting! Your request reached the Railway backend successfully."
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
