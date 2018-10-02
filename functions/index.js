const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./firebase_private_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-66b3d.firebaseio.com/',
});

exports.storePostData = functions.https.onRequest((req, res) => {
  cors( req, res, () => {
    const { id, title, location, image } = req.body;
    return admin.database().ref('posts').push({
      id,
      title,
      location,
      image
    })
    .then(() => {
      return res.status(201).json({message: 'Data stored', id: req.body.id});
    })
    .catch(err => {
      res.status(500).json({error: err});
    })
  })
});
