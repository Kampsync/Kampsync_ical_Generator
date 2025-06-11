// gcsUploader.js
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = process.env.GCLOUD_BUCKET;
const bucket = storage.bucket(bucketName);

async function uploadToGCS(filename, contents) {
  const file = bucket.file(filename);

  await file.save(Buffer.from(contents, 'utf8'), {
    contentType: 'text/calendar',
    public: true,
    resumable: false,
  });
}

module.exports = { uploadToGCS };
