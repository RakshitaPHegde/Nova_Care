const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('astrovital', 1);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('q')) {
      db.createObjectStore('q', { keyPath: 'key' });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const tx = async (
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest
) => {
  const db = await open();

  return new Promise<any>((resolve, reject) => {
    const transaction = db.transaction('q', mode);
    const request = operation(transaction.objectStore('q'));
    let result: any;
    let settled = false;

    const fail = (error: any) => {
      if (settled) return;
      settled = true;
      db.close();
      reject(error);
    };

    request.onsuccess = () => {
      result = request.result;
    };

    request.onerror = () => fail(request.error);

    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      db.close();
      resolve(result);
    };

    transaction.onerror = () => fail(transaction.error);
    transaction.onabort = () => fail(transaction.error);
  });
};

export const enqueue = (record: any) => {
  const now = Date.now();

  return tx('readwrite', store => store.put({
    ...record,
    status: 'pending',
    attempts: 0,
    createdAt: record.createdAt || now,
    updatedAt: now,
    nextRetryAt: 0,
    lastError: null
  }));
};

export const pending = (): Promise<any[]> =>
  tx('readonly', store => store.getAll());

export const update = (record: any) =>
  tx('readwrite', store => store.put({
    ...record,
    updatedAt: Date.now()
  }));

export const remove = (key: string) =>
  tx('readwrite', store => store.delete(key));
