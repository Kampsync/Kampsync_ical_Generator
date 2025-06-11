// gcsUploader.js
const { Storage } = require('@google-cloud/storage');

const bucketName = process.env.GCLOUD_BUCKET;
const storage = new Storage();

async function uploadToGCS(filename, contents) {
  if (!bucketName) throw new Error('Missing GCLOUD_BUCKET in environment');

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filename);

  try {
    await file.save(contents, {
      metadata: { contentType: 'text/calendar' },
      resumable: false,
      public: true
    });
    console.log(`✅ Uploaded to GCS: ${filename}`);
  } catch (err) {
    console.error('❌ GCS upload failed:', err.message || err);
    throw err;
  }
}

module.exports = { uploadToGCS };
