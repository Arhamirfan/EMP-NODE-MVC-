import * as sqsService from '../services/sqsService.js';

// Fetch messages from SQS
export const fetchSqsMessages = async (req, res) => {
  try {
    const messages = await sqsService.getMessages();
    if (messages.length === 0) {
      return res.status(200).json({ message: 'No messages available.' });
    }
    return res.status(200).json({ messages, count: messages.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete a message from SQS
export const deleteSqsMessage = async (req, res) => {
  const { ReceiptHandle } = req.body;
  if (!ReceiptHandle) {
    return res.status(400).json({ error: 'ReceiptHandle is required' });
  }

  try {
    await sqsService.deleteMessage(ReceiptHandle);
    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Get message count from SQS
export const getSqsMessageCount = async (req, res) => {
  try {
    const Attributes = await sqsService.getQueueAttributes();
    const visible = parseInt(Attributes.ApproximateNumberOfMessages, 10);
    const inFlight = parseInt(Attributes.ApproximateNumberOfMessagesNotVisible, 10);

    return res.status(200).json({
      visible,
      inFlight,
      total: visible + inFlight,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch message count' });
  }
}; 