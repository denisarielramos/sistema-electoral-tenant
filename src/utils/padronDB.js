const DB_NAME_PREFIX = "padronDB";
const STORE_NAME = "padronStore";

function getDBName(campaniaId) {
  return `${DB_NAME_PREFIX}_${campaniaId || "default"}`;
}

function openDB(campaniaId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(getDBName(campaniaId), 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "ci" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePadron(padron, campaniaId) {
  const db = await openDB(campaniaId);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const persona of padron) {
      store.put(persona);
    }

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllPadron(campaniaId) {
  const db = await openDB(campaniaId);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
