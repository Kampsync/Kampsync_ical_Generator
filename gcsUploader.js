// gcsUploader.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const bucketName = process.env.GCS_BUCKET_NAME;
const storage = new Storage();

async function uploadToGCS(filename, contents) {
  if (!bucketName) throw new Error('Missing GCS_BUCKET_NAME in environment');

  const file = storage.bucket(bucketName).file(filename);
  const stream = file.createWriteStream({
    metadata: {
      contentType: 'text/calendar'
    },
    resumable: false
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => {
      console.error('❌ GCS stream error:', err.message || err);
      reject(err);
    });

    stream.on('finish', () => {
      console.log(`✅ GCS file written: ${filename}`);
      resolve();
    });

    stream.end(contents);
  });
}

module.exports = { uploadToGCS };
