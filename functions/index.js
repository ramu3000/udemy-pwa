const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');
const fs = require('fs');
const UUID = require('uuid-v4');
const os = require("os");
const Busboy = require("busboy");
const path = require('path');
 

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const serviceAccount = require("./firebase_private_key.json");

// google storage setting with authentication info
const gcconfig = {
  projectId: 'pwagram-66b3d',
  keyFilename: 'firebase_private_key.json'
}
const gcs = require('@google-cloud/storage')(gcconfig)


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-66b3d.firebaseio.com/',
});

exports.storePostData = functions.https.onRequest((req, res) => {
  cors( req, res, () => {
    const uuid = UUID();
    
    const busboy = new Busboy({ headers: req.headers });
    // These objects will store the values (file + fields) extracted from busboy
    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
      fields[fieldname] = val;
    });
    
    busboy.on("finish", () => { 
      var bucket = gcs.bucket('pwagram-66b3d.appspot.com');
      const { id, title, location } = fields;

      bucket.upload(upload.file, {
        uploadType: 'media',
        metadata: {
          metadata: {
            contentType: upload.type,
            firebaseStorageDownloadTokens: uuid
          }
        }
        }, (err, uploadedFile) => {
          if(!err){   
            admin
              .database()
              .ref('posts')
              .push({
                id,
                title,
                location,
                image: 
                  'https://firebasestorage.googleapis.com/v0/b/' + 
                  bucket.name + 
                  '/o/' + 
                  encodeURIComponent(uploadedFile.name) 
                  + '?alt=media&token=' + uuid
              })
            .then(() => {
              webpush.setVapidDetails(
                'mailto:rasmus.laine@gmail.com','BNylVnFADyxx0HO4W_cxUc9q8_RIHKZ9N0w28dyJUa5oXWkhnfC4aJ3EDXjpHdWADChseT-_zu6zTwsisD9t2Ws', 
                functions.config().vapid.secret_key
                );
              return admin
                .database()
                .ref('subscriptions')
                .once('value');
            })
            .then(subscriptions => {
              const myPromises = [];

              subscriptions.forEach(sub => {
                const pushConfig = {
                  endpoint: sub.val().endpoint,
                  keys: {
                    auth: sub.val().keys.auth,
                    p256dh: sub.val().keys.p256dh
                  }
                };
                myPromises.push(
                  webpush.sendNotification(
                    pushConfig, 
                    JSON.stringify({
                      title,
                      content: location,
                      openUrl: '/help'
                    })
                  )
                )
              })
              return Promise.all(myPromises);
            })
            .catch(err => {
              console.log(err);
            })
            .then( () => {
              return res.status(201).json({message: 'Data stored', id: fields.id});
            })
            .catch(err => {
              res.status(500).json({error: err});
            })
        } else {
          console.log('bucket upload failed:', err);
        }
      })//end upload file
    });//END busboy finnish
    busboy.end(req.rawBody);
  });// end cors
});// storepostdata
