import { useState, useEffect, useMemo } from "react";
import { openDB, type IDBPDatabase } from "idb";

export const storeName = "conversations";
export const dbName = "polychat";

// Shared database promise to ensure we only open the connection once
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Get or initialize the database connection.
 * This can be used directly in services that don't need React hooks.
 */
export const getDatabase = () => {
	if (!dbPromise) {
		dbPromise = openDB(dbName, 2, {
			upgrade(db, oldVersion) {
				if (oldVersion < 1) {
					db.createObjectStore(storeName, {
						keyPath: "id",
						autoIncrement: true,
					});
				}
			},
		});
	}
	return dbPromise;
};

/**
 * React hook for IndexedDB access.
 * Use this in components that need to interact with the database.
 */
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

	return { 
		db: memoizedDb, 
		loading, 
		error
	};
}