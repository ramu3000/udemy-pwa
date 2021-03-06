'use strict'

importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');


const CACHE_STATIC_NAME = 'static-v43';
const CACHE_DYNAMIC_NAME = 'dynamic-v4';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/utility.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];


// helper function for deleting cache, it will delete the oldest one.
// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then( cache => {
//       return cache.keys()
//       .then ( keys => {
//         if(maxItems < keys.length) {
//           cache.delete(keys[0])
//             .then(trimCache(cacheName, maxItems))
//         }
//       })
//     })
    
// }

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then( cache => {
        console.log('[Service Worker] Precaching App shell');
        cache.addAll(STATIC_FILES);
      })
    );
});


self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then( keyList => {
        return Promise.all(keyList.map( key => {
          if(key !== CACHE_STATIC_NAME && 
             key !== CACHE_DYNAMIC_NAME){
            console.log('[Service Worker] removing old cache', key)
            return caches.delete(key);
          }
          
        }));
      })
  );
  return self.clients.claim();
});



self.addEventListener('fetch', function(event) {
  const url = 'https://pwagram-66b3d.firebaseio.com/posts';

  //if matches, network only and cache then network strategy
  if(event.request.url.indexOf(url) > -1){
    event.respondWith(fetch(event.request)
      .then(res => {
        const clonedRes = res.clone();
        clearAllData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then(data => {
            for(var key in data){
              writeData('posts', data[key]);
            }
          })
        return res;
      })
    );
  } else if ( STATIC_FILES.includes(event.request.url) ){
    //this is cache-only for all the static-files
      event.respondWith(
        caches.match(event.request)
      );
  } else {
    //cache with network fallback //always check
    event.respondWith(
      caches.match(event.request)
        .then( response => {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(res => {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then( cache => {
                    // trimCache(CACHE_DYNAMIC_NAME, 3)
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              .catch(function (err) {
                return caches.open(CACHE_STATIC_NAME)
                  .then( cache => {
                    if(event.request.headers.get('accept').includes('text/html')){
                      return cache.match('/offline.html')
                    }
                  })
              });
          }
        })
    );
  }


});



// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then( response => {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(res => {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then( cache => {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function (err) {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then( cache => {
//                   return cache.match('/offline.html')
//                 })
//             });
//         }
//       })
//   );
// });


//network-first 
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(res => {
//         return caches.open(CACHE_DYNAMIC_NAME)
//           .then(cache => {
//             cache.put(event.request.url, res.clone());
//             return res;
//           })
//       })
//       .catch( err => {
//         return caches.match(event.request)
//       })

//   );
// });


//cache-only
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

self.addEventListener('sync', function(event) {
  console.log('[Service Woirker] background syncing', event);
  if(event.tag === 'sync-new-posts'){
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
    readAllData('sync-posts')
        .then(data => {
          for (let dt of data) {
            const postData = new FormData();
            const { id, title, location, picture, rawLocation } = dt;
            
            postData.append('id', id)
            postData.append('title', title)
            postData.append('location', location)
            postData.append('rawLocationLat', rawLocation.lat)
            postData.append('rawLocationLng', rawLocation.lng)
            postData.append('file', picture, dt.id + '.png')
            
            fetch('https://us-central1-pwagram-66b3d.cloudfunctions.net/storePostData', {
              method: 'POST',
              body: postData
            })
            .then( res => {
              console.log('[Service Worker] fetch sync response', res);
              if(res.ok){
                res.json()
                  .then(resData => {
                    console.log('[Service Worker] fetch sync response data', resData);
                    deleteItemFromData('sync-posts', resData.id);
                  })
                
              }
            
            })

          }
        })
        .catch( err => {
          console.log('[Service Worker] error sending synced data', err)
        })
    );
  }
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  var action = event.action;
  console.log(notification);

  if(action === 'confirm') {
    console.log('Confirm was chosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then(clis => {
          var client = clis.find(c => {
            return c.visibilty === 'visible';
          });

          if(client !== undefined){
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
          console.log('notification data:', notification.data.url)
          notification.close();
        })
    );
  }

})


/*
* notification closed, user did not interact with notification
* main purpose might be for analytics to get info why this content is not interesting
*/
self.addEventListener('notificationclose', event => {
  console.log('notification was close', event);
})

self.addEventListener('push', event => {
  console.log('Push notification received', event);
  var data = {title: 'New!', content: 'Somethin new happened!', openUrl: '/'}
  if(event.data) {
    data = JSON.parse(event.data.text());
  }
  console.log('event data:', event.data.json(), 'new data:', data);
  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});