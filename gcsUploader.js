// gcsUploader.js
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket(process.env.GCLOUD_BUCKET);

async function uploadToGCS(filename, contents) {
  const file = bucket.file(filename);

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'text/calendar',
      },
      resumable: false,
      public: true,
    });

    stream.on('error', (err) => {
      console.error('❌ GCS stream error:', err.message || err);
      reject(err);
    });

    stream.on('finish', () => {
      console.log(`✅ GCS upload complete: ${filename}`);
      resolve();
    });

    // Explicitly buffer the string as UTF-8
    stream.end(Buffer.from(contents, 'utf-8'));
  });
}

module.exports = { uploadToGCS };
