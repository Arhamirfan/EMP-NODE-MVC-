import pool from '../config/db.js';

export const updateProductDetails = async (productId, data) => {
  const { vendor_name } = data;

  if (!vendor_name) {
    throw new Error("vendor_name is required to update vendor details.");
  }

  try {
    // Step 1: Read the existing vendor_details
    const selectQuery = 'SELECT vendor_details FROM products_scrapped WHERE product_id = $1';
    const selectResult = await pool.query(selectQuery, [productId]);

    if (selectResult.rows.length === 0) {
      throw new Error(`Product with product_id '${productId}' not found.`);
    }

    const currentVendorDetails = selectResult.rows[0].vendor_details || [];

    // Step 2: Modify the array in JavaScript by filtering out the specified vendor
    const newVendorDetails = currentVendorDetails.filter(vendor => vendor.vendor !== vendor_name);

    if (newVendorDetails.length === currentVendorDetails.length) {
        console.warn(`Vendor '${vendor_name}' not found in vendor_details for product '${productId}'. No update performed.`);
        return selectResult.rows[0];
    }
    
    // Step 3: Write the new array back to the database
    const updateQuery = 'UPDATE products_scrapped SET vendor_details = $1 WHERE product_id = $2 RETURNING *';
    const updateResult = await pool.query(updateQuery, [JSON.stringify(newVendorDetails), productId]);
    
    console.log(`Successfully removed vendor '${vendor_name}' for product '${productId}'.`);
    return updateResult.rows[0];

  } catch (error) {
    console.error(`Error updating product '${productId}' in database:`, error.message);
    throw error;
  }
}; 