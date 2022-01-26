let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};


request.onsuccess = function(event) {
    db = event.target.result;
    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};
// This function will be executed if we attempt to submit a new budget
function saveBudget(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');
// access the object store for 'new_budget'
    const budgetObjectStore = transaction.objectStore('new_transaction');
// add budget to you store with add method
    budgetObjectStore.add(record);
};

// function that will handle collecting all of the data 
function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access your object store
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    // get all transactions from store and set to a variable
    const getAll = budgetObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          // access the object store
          const budgetObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          budgetObjectStore.clear();

          alert('All saved transactions has been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);