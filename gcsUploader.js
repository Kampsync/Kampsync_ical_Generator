// gcsUploader.js
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket(process.env.GCLOUD_BUCKET);

async function uploadToGCS(filename, contents) {
  const file = bucket.file(filename);

  const stream = file.createWriteStream({
    metadata: {
      contentType: 'text/calendar',
    },
    public: true,
    resumable: false,
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => {
      reject(err);
    });

    stream.on('finish', () => {
      resolve();
    });

    stream.end(Buffer.from(contents, 'utf8'));
  });
}

module.exports = { uploadToGCS };
