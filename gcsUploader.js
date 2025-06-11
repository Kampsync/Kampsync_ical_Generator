// gcsUploader.js
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = process.env.GCLOUD_BUCKET;

async function uploadToGCS(filename, contents) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filename);
  await file.save(contents, {
    contentType: 'text/calendar',
    public: true,
    resumable: false
  });
}

module.exports = { uploadToGCS };
