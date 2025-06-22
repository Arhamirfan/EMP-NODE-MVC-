import express from 'express';
import { updateProduct } from '../../controllers/productsController.js';

const router = express.Router();

// Update a product
router.put('/:product_id', updateProduct);

export default router; 