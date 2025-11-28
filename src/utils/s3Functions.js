import { ListBucketsCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from "dotenv";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
dotenv.config()

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3Connection() {
  try {
    console.log('Testing S3 connection...');
    const data = await s3Client.send(new ListBucketsCommand({}));
    console.log("S3 connection successful. Buckets:", data.Buckets);
  } catch (err) {
    console.error("S3 connection error:", err);
  }
}

testS3Connection();

// Configure multer for S3 upload
export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Determine folder based on field name
      let folder = '';

      // Create unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = folder + uniqueSuffix + '-' + file.originalname;
      cb(null, filename);
    }
  })
});

export const uploadMulti = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// Function to delete file from S3 by URL
export async function deleteFileByUrl(fileUrl) {
  try {
    // Extract the key (filename) from the URL
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.slice(1)); // Remove leading slash and decode

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log('File deleted successfully:', key);
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, message: error.message };
  }
}

export async function generatePresignedUrl(objectKey) {
  if (!objectKey) {
    console.warn('No object key provided for presigned URL generation');
    return null;
  }

  // Remove the full S3 URL if it exists and extract just the key
  const key = objectKey.replace('https://e-notary-dev.s3.ap-south-1.amazonaws.com/', '');

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn: 36000 });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return objectKey; // Return original URL if generation fails
  }
}