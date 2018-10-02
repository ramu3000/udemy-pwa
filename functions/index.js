const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.storePostData = functions.https.onRequest((request, response) => {
  cors( (req, res) => {
    const { id, title, location, image } = req.body;
    return admin.database().ref('posts').push({
      id,
      tile,
      location,
      image
    })
    .then(() => {
      return response.status(201).json({message: 'Data stored', id: req.body.id});
    })
    .catch(err => {
      response.status(500).json({error: err});
    })
  })
});
