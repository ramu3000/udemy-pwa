const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');

 

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
      webpush.setVapidDetails('mailto:rasmus.laine@gmail.com','BNylVnFADyxx0HO4W_cxUc9q8_RIHKZ9N0w28dyJUa5oXWkhnfC4aJ3EDXjpHdWADChseT-_zu6zTwsisD9t2Ws', functions.config().vapid.secret_key)
      return admin.database().ref('subscriptions').once('value');
      
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
          webpush.sendNotification(pushConfig, JSON.stringify({
            title,
            content: location,
            openUrl: '/help'
        })
        ))
      })
    return Promise.all(myPromises);
    })
    .catch(err => {
      console.log(err);
    })
    .then( () => {
      return res.status(201).json({message: 'Data stored', id: req.body.id});
    })
    .catch(err => {
      res.status(500).json({error: err});
    })
  })
});
