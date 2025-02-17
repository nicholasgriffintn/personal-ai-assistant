import { useState, useEffect, useMemo } from 'react';
import { openDB, type IDBPDatabase } from 'idb';

import { dbName, storeName, settingsStoreName } from '../constants';

export function useIndexedDB() {
	const [db, setDb] = useState<IDBPDatabase | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: That would cause more renders
	useEffect(() => {
		const initDb = async () => {
			try {
				const db = await openDB(dbName, 2, {
					upgrade(db, oldVersion) {
						if (oldVersion < 1) {
							db.createObjectStore(storeName, {
								keyPath: 'id',
								autoIncrement: true,
							});
						}
						if (oldVersion < 2) {
							db.createObjectStore(settingsStoreName, {
								keyPath: 'id',
							});
						}
					},
				});
				setDb(db);
			} catch (err) {
				setError(err as Error);
				console.error('Failed to initialize IndexedDB:', err);
				alert('Failed to initialize database. Please try again.');
			} finally {
				setLoading(false);
			}
		};
		initDb();

		return () => {
			db?.close();
		};
	}, []);

	const memoizedDb = useMemo(() => db, [db]);

	return { db: memoizedDb, loading, error };
}
