import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './middleware/logEvents.js';
import errorHandler from './middleware/errorHandler.js';
import sqsRoutes from './routes/api/sqs.js';
import productRoutes from './routes/api/products.js';
import { startAutomation } from './services/automation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(logger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/sqs', sqsRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Automation server is running' });
});

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({ error: "404 Not Found" });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
  startAutomation();
});