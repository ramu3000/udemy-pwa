'use strict'

const CACHE_STATIC_NAME = 'static-v13';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]
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
  var url = 'https://pwagram-66b3d.firebaseio.com/posts';

  //if matches, network only and cache then network strategy
  if(event.request.url.indexOf(url) > -1){
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then( cache => {
          return fetch(event.request)
            .then(res => {
              // trimCache(CACHE_DYNAMIC_NAME, 3)
              cache.put(event.request, res.clone())
              return res;
            })
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