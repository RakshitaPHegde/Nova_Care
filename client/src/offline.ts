const open=()=>new Promise<IDBDatabase>((res,rej)=>{const r=indexedDB.open('astrovital',1);r.onupgradeneeded=()=>r.result.createObjectStore('q',{keyPath:'key'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=async(m:IDBTransactionMode,f:(s:IDBObjectStore)=>IDBRequest)=>{const d=await open();return new Promise<any>((res,rej)=>{const r=f(d.transaction('q',m).objectStore('q'));r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})};
export const enqueue=(rec:any)=>tx('readwrite',s=>s.put(rec));
export const pending=():Promise<any[]>=>tx('readonly',s=>s.getAll());
export const remove=(k:string)=>tx('readwrite',s=>s.delete(k));
