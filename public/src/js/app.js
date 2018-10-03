'use strict'
var deferredPrompt;
const enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if('serviceWorker' in navigator) {
    const options = {
      body: 'You succesfully subscrided to our app notification',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US', // BCP 47
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
        { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
      ]
    };

    navigator.serviceWorker.ready
      .then(swreg => {
        swreg.showNotification('Successfully subscribed!', options)
      })
  }
}
function configurePushSub() {
  if ( !('serviceWorker' in navigator) ) {
    return;
  }
  let reg;
  navigator.serviceWorker.ready
    .then(swReg => {
      reg = swReg;
      return swReg.pushManager.getSubscription();
    })
    .then(sub => {
      if(sub === null) {
        //new subscription
        const vapidPublicKey = 'BNylVnFADyxx0HO4W_cxUc9q8_RIHKZ9N0w28dyJUa5oXWkhnfC4aJ3EDXjpHdWADChseT-_zu6zTwsisD9t2Ws';
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        //we have a subscription
      }
    })
    .then(newSub => {
      fetch('https://pwagram-66b3d.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then(res => {
      console.log('res', res);
      if(res.ok){
        displayConfirmNotification();
      }
    })
    .catch(err => {
      console.log('error sub', err)
    })
}

function askForNotificationPermission(e) {
 Notification.requestPermission(result => {
   console.log('User Choice', result);
   if(result !== 'granted') {
     console.log('No notification permission given');
   } else {
    configurePushSub();
    //displayConfirmNotification();
   }

 })
}

if('Notification' in window && 'serviceWorker' in navigator) {
  enableNotificationsButtons.forEach(buttonElement => {
    buttonElement.style.display = 'inline-block';
    buttonElement.addEventListener('click', askForNotificationPermission)
  });
}