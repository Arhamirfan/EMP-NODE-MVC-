import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const sqs = new AWS.SQS({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const QUEUE_URL = process.env.QUEUE_URL;

export const getMessages = async (maxMessages = 10) => {
  try {
    const response = await sqs.receiveMessage({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 10,
      VisibilityTimeout: 20,
    }).promise();

    const messages = response.Messages || [];
    if (messages.length === 0) {
      return [];
    }

    return messages.map(msg => {
      const data = JSON.parse(msg.Body);
      data.MessageId = msg.MessageId;
      data.ReceiptHandle = msg.ReceiptHandle;
      return data;
    });
  } catch (error) {
    console.error("Error fetching SQS messages:", error.message);
    throw error;
  }
};

export const deleteMessage = async (receiptHandle) => {
  try {
    await sqs.deleteMessage({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receiptHandle,
    }).promise();
    console.log(`Successfully deleted message from SQS.`);
  } catch (error) {
    console.error('SQS deleteMessage error:', error.message);
    throw error;
  }
};

export const getQueueAttributes = async () => {
  try {
    const { Attributes } = await sqs.getQueueAttributes({
      QueueUrl: QUEUE_URL,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
      ],
    }).promise();
    return Attributes;
  } catch (error) {
    console.error('SQS GetQueueAttributes error:', error.message);
    throw error;
  }
}; 