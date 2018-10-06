var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
let picture;
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
let fetchedLocation = {lat: 0, lng:0 };

locationBtn.addEventListener('click', event => {
  if( !('geolocation' in navigator)){
    return;
  }
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block'
  navigator.geolocation.getCurrentPosition(
    position => {
      locationBtn.style.display = 'block';
      locationLoader.style.display = 'none';
      fetchedLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      locationInput.value = 'In Helsinki'//dummy, use google location to get real value
      document.querySelector('#manual-location').classList.add('is-focused');

    }, err => {
      console.log(err)
      locationBtn.style.display = 'inline';
      locationLoader.style.display = 'none';
      alert('Couldnt fetch location');
      fetchedLocation = {lat: 0, lng: 0};
    }, 
    {timeout: 10000}
  );

})

function initializeLocation() {
  if( !('geolocation' in navigator)){
    locationBtn.style.display = 'none';
  }
}

function initializeMedia() {
  if( !('mediaDevices' in navigator)){
      navigator.mediaDevices = {};
  }
  if( !('getUserMedia' in navigator.mediaDevices) ){
    navigator.mediaDevices.getUserMedia = function(constrains){
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      
      if(!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented'))
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constrains, resolve, reject)
      });
    }
  }

  navigator.mediaDevices.getUserMedia({video: true})
    .then(stream => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(err => {
      imagePickerArea.style.display = 'block';
    })
}

captureButton.addEventListener('click', event => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';

  var context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach(track => {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL())
})

imagePicker.addEventListener('change', event=> {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  setTimeout(() => {
    createPostArea.classList.add('active');
  },0)
  
  initializeMedia();
  initializeLocation();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // unregister serviceWorker
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations()
  //     .then(registrations => {
  //       registrations.forEach(registration => {
  //         console.log('unregistered:', registration)
  //         registration.unregister();
  //       });
  //     })
  // }
}

function closeCreatePostModal() {
  setTimeout(() => {
    createPostArea.classList.remove('active');
  },0)
  
  imagePickerArea.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  canvasElement.style.display = 'none';
  captureButton.style.display = 'inline';
  
  setTimeout(() => {
    if(videoPlayer.srcObject) {
      videoPlayer.srcObject.getVideoTracks().forEach(track => {
        track.stop();
      })
    }
    videoPlayer.style.display = 'none';
  },500)
}



shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// currently not in use caches dynamically
function onSaveButtonClick(event){
  if('caches' in window){
    caches.open('user-requested')
    .then( cache => {
      cache.add('https://httpbin.org/get');
      cache.add('/src/images/sf-boat.jpg');
    });
  }
}
function clearCards() {
  while(sharedMomentsArea.hasChildNodes()){
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}
function createCard(data) {

  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("'+ data.image + '")';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'black';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClick);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data){
  clearCards();
  console.log('dataarray', data)
  for(let i = 0; i < data.length; i++){
    createCard(data[i])
  }
}

var url = 'https://pwagram-66b3d.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log('from web:', data);
    var dataArray = [];
    for (var key in data){
      dataArray.push(data[key])
    }
    updateUI(dataArray);
  });


if('indexedDB' in window){
  readAllData('posts')
    .then(data => {
      if(!networkDataReceived){
        console.log('from cache:', data);
        updateUI(data);

      }
    })
}

function sendData() {
  const id = new Date().toISOString;
  const postData = new FormData();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat)
  postData.append('rawLocationLng', fetchedLocation.lng)
  postData.append('file', picture, id + '.png')

  fetch('https://us-central1-pwagram-66b3d.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData
  })
  .then( res => {
    console.log('sent data', res);
    updateUI(data);
  })
}

form.addEventListener('submit', event => {
  event.preventDefault();

  if(titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    console.log('form not valid');
    return;
  }
  closeCreatePostModal();

  if('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(sw => {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture,
          rawLocation: fetchedLocation
        };
        writeData('sync-posts', post)
          .then( () => {
            return sw.sync.register('sync-new-posts');
          })
          .then(() => {
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your post was saved for syncing'}
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(err => {
            console.log(err);
          })

      })
  } else {
    sendData();
  }
});