import * as productService from '../services/productService.js';

// Update a product record by processing an automation result
export const updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const { vendor_name } = req.body;

  if (!vendor_name) {
    return res.status(400).json({ error: 'The vendor_name is required in the request body.' });
  }

  try {
    const updatedProduct = await productService.updateProductDetails(product_id, { vendor_name });
    res.status(200).json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
}; 