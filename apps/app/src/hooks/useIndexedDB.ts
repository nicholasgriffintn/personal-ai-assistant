import { useState, useEffect, useMemo } from "react";
import { openDB, type IDBPDatabase } from "idb";

import { dbName, storeName, settingsStoreName } from "../constants";

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDatabase = () => {
	if (!dbPromise) {
		dbPromise = openDB(dbName, 2, {
			upgrade(db, oldVersion) {
				if (oldVersion < 1) {
					db.createObjectStore(storeName, {
						keyPath: "id",
						autoIncrement: true,
					});
				}
				if (oldVersion < 2) {
					db.createObjectStore(settingsStoreName, {
						keyPath: "id",
					});
				}
			},
		});
	}
	return dbPromise;
};

export function useIndexedDB() {
	const [db, setDb] = useState<IDBPDatabase | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let mounted = true;

		const initDb = async () => {
			try {
				const database = await getDatabase();
				if (mounted) {
					setDb(database);
				}
			} catch (err) {
				if (mounted) {
					setError(err as Error);
					console.error("Failed to initialize IndexedDB:", err);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		initDb();

		return () => {
			mounted = false;
		};
	}, []);

	const memoizedDb = useMemo(() => db, [db]);

	return { db: memoizedDb, loading, error };
}
