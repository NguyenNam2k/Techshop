require('dotenv').config();

const express = require('express');
const productRoutes = require('./routes/product.routes');

const app = express();


app.use(express.json());


app.use('/api/products', productRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;