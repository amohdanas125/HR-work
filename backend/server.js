require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const { seedHelper } = require('./routes/products');

const app = express();

// ═══ MIDDLEWARES ═══
app.use(cors());
// Set rich payload limit to safely parse base64 image strings from forms
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ═══ CONNECT TO MONGODB ATLAS ═══
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI environment variable is missing in .env file.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Successfully connected to MongoDB Atlas database Cluster.");
    
    // 1. Auto-seed Admin credentials if empty
    try {
      const adminCount = await User.countDocuments();
      if (adminCount === 0) {
        console.log("Seeding default administrator account...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('hrwork@2024', salt);
        
        const defaultAdmin = new User({
          username: 'admin',
          password: hashedPassword
        });
        
        await defaultAdmin.save();
        console.log("✅ Seeded default admin account successfully: admin / hrwork@2024");
      }
    } catch (err) {
      console.error("Failed to seed default admin credentials:", err);
    }

    // 2. Auto-seed product catalogue if empty
    try {
      const seeded = await seedHelper();
      if (seeded) {
        console.log("✅ Product catalogue was empty. Seeded 16 default surgical instruments successfully.");
      }
    } catch (err) {
      console.error("Failed to auto-seed default products:", err);
    }
  })
  .catch(err => {
    console.error("❌ MongoDB Atlas database connection failure:", err.message);
  });

// ═══ API ROUTING ═══
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));

// ═══ ROOT ALIVE CHECK ═══
app.get('/', (req, res) => {
  res.json({
    name: "HR Work Catalogue API",
    status: "Healthy",
    message: "Server is alive and operational. Database and CDN endpoints are connected."
  });
});

// ═══ START EXPRESS SERVER ═══
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Express API server running on port ${PORT}`);
});
