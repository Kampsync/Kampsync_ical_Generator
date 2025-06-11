// gcsUploader.js
const { Storage } = require('@google-cloud/storage');

const bucketName = process.env.GCLOUD_BUCKET;
const storage = new Storage();

async function uploadToGCS(filename, contents) {
  if (!bucketName) throw new Error('Missing GCLOUD_BUCKET in environment');

  const file = storage.bucket(bucketName).file(filename);

  try {
    await file.save(contents, {
      contentType: 'text/calendar',
      resumable: false,
    });
    console.log(`✅ GCS file uploaded via save(): ${filename}`);
  } catch (err) {
    console.error('❌ GCS upload failed:', err.message || err);
    throw err;
  }
}

module.exports = { uploadToGCS };
