import { openDB } from "idb";

const DB_NAME = "[name]-pos";
const ITEMS_STORE = "items";
const META_STORE = "meta";
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ITEMS_STORE)) {
        db.createObjectStore(ITEMS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    },
  });
};

export const getLastUpdate = async (): Promise<number> => {
  const db = await initDB();
  return db.get(META_STORE, "lastUpdate") || 0;
};
