// src/services/data-access/user-data.ts
'use server';

import * as path from 'path';
import type { User } from '@/types/user-types';
import { readDb } from '@/lib/database-utils';

const DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'users.json');

const DEFAULT_USERS: User[] = [
    {
      id: "usr_dev_iwg",
      username: "dev_admin",
      password: "password123",
      role: "Admin Developer",
      email: "dev@example.com",
      displayName: "Developer Admin",
      createdAt: new Date().toISOString(),
      whatsappNumber: ""
    },
    {
      id: "usr_owner_default",
      username: "owner",
      password: "password123",
      role: "Owner",
      email: "owner@example.com",
      displayName: "Default Owner",
      createdAt: new Date().toISOString()
    }
];

/**
 * Reads the entire user database.
 * This is a low-level data access function.
 * @returns A promise that resolves to an array of all User objects.
 */
export async function getAllUsers(): Promise<User[]> {
    // This now correctly returns the contents of the DB file, even if empty.
    // The previous logic incorrectly returned default data if the file was empty.
    return await readDb<User[]>(DB_PATH, []);
}
