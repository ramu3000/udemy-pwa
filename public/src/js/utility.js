var dbPromise =  idb.open('posts-store',1, db => {
  if(!db.objectStoreNames.contains('posts')){
    db.createObjectStore('posts', { keyPath: 'id' } );
  }
});

function writeData(st, data) {
  return dbPromise
  .then(db => {
    var tx = db.transaction(st, 'readwrite');
    var store = tx.objectStore(st);
    store.put(data);
    return tx.complete;
  });
}

function readAllData(st){
  return dbPromise
    .then(db => {
      var tx = db.transaction(st, 'readonly');
      var store = tx.objectStore(st);
      return store.getAll();
    });
}

function clearAllData(st){
  return dbPromise
    .then(function(db){
      var tx = db.transaction(st, 'readwrite')
      var store = tx.objectStore(st);
      store.clear();
      return tx.complete;
    })
}

const deleteItemFromData = (st, id) => {
  return dbPromise
    .then((db) => {
      var tx = db.transaction(st, 'readwrite');
      var store = tx.objectStore(st);
      store.delete(id)
      return tx.complete
    })
    .then(() => {
      console.log('item deleted');
    })
}