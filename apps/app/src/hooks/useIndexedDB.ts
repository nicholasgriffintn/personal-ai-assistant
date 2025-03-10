import { type IDBPDatabase, openDB } from "idb";
import { useEffect, useMemo, useState } from "react";

export const storeName = "conversations";
export const dbName = "polychat";

export const isIndexedDBSupported = () => {
	return typeof window !== "undefined" && "indexedDB" in window;
};

// Shared database promise to ensure we only open the connection once
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Get or initialize the database connection.
 * This can be used directly in services that don't need React hooks.
 */
export const getDatabase = () => {
	if (!isIndexedDBSupported()) {
		return Promise.reject(
			new Error("IndexedDB is not supported in this browser"),
		);
	}

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
	const [isSupported] = useState<boolean>(isIndexedDBSupported());

	useEffect(() => {
		let mounted = true;

		const initDb = async () => {
			if (!isSupported) {
				if (mounted) {
					setError(new Error("IndexedDB is not supported in this browser"));
					setLoading(false);
				}
				return;
			}

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
	}, [isSupported]);

	const memoizedDb = useMemo(() => db, [db]);

	return {
		db: memoizedDb,
		loading,
		error,
		isSupported,
	};
}
