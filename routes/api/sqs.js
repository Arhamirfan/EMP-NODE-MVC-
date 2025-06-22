import express from 'express';
import { fetchSqsMessages, deleteSqsMessage, getSqsMessageCount } from '../../controllers/sqsController.js';

const router = express.Router();

// Fetch messages from SQS
router.get('/fetch-sqs-messages', fetchSqsMessages);

// Delete a message from SQS
router.post('/delete-sqs', deleteSqsMessage);

// Get message count from SQS
router.get('/sqs-count', getSqsMessageCount);

export default router; 