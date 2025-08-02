
// src/services/data-access/user-data.ts
'use server';

import * as path from 'path';
import type { User } from '@/types/user-types';
import { readDb } from '@/lib/database-utils';

const DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'users.json');

/**
 * Reads the entire user database.
 * This is a low-level data access function.
 * @returns A promise that resolves to an array of all User objects.
 */
export async function getAllUsers(): Promise<User[]> {
    return await readDb<User[]>(DB_PATH, []);
}

export async function getSubscriptionsForUserIds(userIds: string[]): Promise<{userId: string, subscription: any}[]> {
    const allSubscriptions = await readDb<{userId: string, subscription: any}[]>(path.resolve(process.cwd(), 'src', 'database', 'subscriptions.json'), []);
    return allSubscriptions.filter(sub => userIds.includes(sub.userId));
}
