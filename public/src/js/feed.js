var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');

function openCreatePostModal() {
  createPostArea.classList.add('active')
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
  createPostArea.classList.remove('active')
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


