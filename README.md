# Automation Server

A Node.js automation server that reads data from AWS SQS and performs web automation using Playwright. The server processes product URLs, takes screenshots, and updates a PostgreSQL database with the results.

## Features

- **AWS SQS Integration**: Fetches messages from SQS queue containing product data
- **Playwright Automation**: Performs web automation with stealth mode
- **PostgreSQL Database**: Updates product records in Supabase PostgreSQL
- **Vendor-Specific Automation**: Supports ASDA, Sainsbury's, and Amazon UK
- **Screenshot Capture**: Takes full-page screenshots of product pages
- **Error Handling**: Robust error handling and logging
- **Background Processing**: Runs continuously in the background

## Prerequisites

- Node.js 16+ 
- PostgreSQL database (Supabase)
- AWS SQS queue
- AWS credentials

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `env.example` to `.env` and configure your environment variables
4. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3500

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_DEFAULT_REGION=us-east-1
QUEUE_URL=https://sqs.us-east-1.amazonaws.com/your-account-id/your-queue-name

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

## Database Schema

The server expects a `products_scrapped` table with the following structure. The `vendor_details` column is a JSONB field used to store scraping metadata like status, screenshot paths, and timestamps.

```sql
CREATE TABLE products_scrapped (
  id BIGINT PRIMARY KEY,
  product_id TEXT,
  product_name TEXT,
  quantity TEXT,
  preferred_vendors JSONB,
  vendor_details JSONB
);
```

## Usage

To start the server and the background automation worker, run:

```bash
npm start
```

For development with automatic server restarts, use:
```bash
npm run dev
```
The server will start, and the automation cron job will begin running on its schedule (every 5 minutes).

## API Endpoints

- `GET /health` - Health check
- `GET /api/fetch-sqs-messages` - Fetch messages from SQS
- `POST /api/delete-sqs` - Delete a message from SQS
- `GET /api/sqs-count` - Get message count from SQS
- `PUT /api/product/:product_id` - Update a product's details

## SQS Message Format

The server expects SQS messages in the following JSON format:

```json
{
  "url": "https://example.com/product",
  "vendor_name": "asda",
  "id": "product_123",
  "name": "Product Name",
  "quantity": 1
}
```

## Supported Vendors

- **ASDA**: `vendor_name: "asda"`
- **Sainsbury's**: `vendor_name: "sainsbury's"`
- **Amazon UK**: `vendor_name: "amazon uk"`

## Project Structure

```
├── config/
│   └── db.js              # PostgreSQL connection
├── controllers/
│   └── sqsController.js   # SQS API controllers
├── middleware/
│   ├── errorHandler.js    # Error handling middleware
│   └── logEvents.js       # Request logging
├── routes/
│   └── api/
│       └── sqs.js         # SQS API routes
├── services/
│   └── automation.js      # Main automation service
├── logs/                  # Application logs
├── screenshots/           # Captured screenshots
├── server.js              # Express server
└── package.json
```

## Logging

The server logs all requests and errors to the `logs/` directory:
- `reqLog.txt` - Request logs
- `errLog.txt` - Error logs

## Error Handling

The automation service includes comprehensive error handling:
- Network timeouts
- Invalid URLs
- Database connection issues
- SQS API errors
- Playwright automation failures

## Final Code & Workflow Review

The application is now a single, unified process. When you run npm start, both the API server and the background automation worker are initialized.

### 1. Application Startup (npm start)

1. You run the command npm start.
2. server.js is executed.
3. API Server Starts: An Express.js server is initialized, setting up all the middleware (logging, error handling) and API routes (/api/sqs/*, /api/products/*). The server begins listening for HTTP requests on the specified port.
4. Automation Worker Starts: Immediately after the API server is up, the listen callback in server.js calls the startAutomation() function from services/automation.js. This initializes the cron job, which is now scheduled to run every 5 minutes.

### 2. The Automation Cycle (Runs every 5 minutes)

This is the core background task:
1. Cron Trigger: The scheduled job inside services/automation.js triggers.
2. Fetch Jobs: The runAutomation function calls sqsService.getMessages(3), which fetches up to 3 messages from your AWS SQS queue.
3. Process Jobs:
 - If there are no messages, the function logs a message and waits for the next 5-minute interval.
 - If messages are found, it loops through each one and calls automateProduct(product).
4. Single Product Automation (automateProduct):
 - Playwright is launched in a browser.
 - The automation logic for the specific vendor (Asda, etc.) is executed.
5. On Success:
 - The productService.updateProductDetails() function is called. This function reads the product's current vendor_details from your PostgreSQL database, removes the vendor that was just processed, and saves the updated array back to the database.
 - The sqsService.deleteMessage() function is called, which permanently removes the message from the SQS queue to prevent it from being processed again.
6. On Failure:
 - If any error occurs during the Playwright automation or database update, the catch block logs the error.
 - Crucially, the SQS message is not deleted. It will become visible in the queue again after its "visibility timeout" expires, allowing the worker to retry processing it on a future run.
