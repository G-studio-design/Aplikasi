// src/services/notification-service.ts
'use server';

import * as path from 'path';
import type { User } from '@/types/user-types';
import { getAllUsersForDisplay } from './user-service';
import { readDb, writeDb } from '@/lib/database-utils';
import type { PushSubscription } from 'web-push';

export interface Notification {
    id: string;
    userId: string;
    projectId?: string;
    message: string;
    timestamp: string;
    isRead: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

// Data structure for the new API route
interface SendNotificationApiPayload {
    userIds: string[];
    payload: NotificationPayload;
}


const NOTIFICATION_DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'notifications.json');
const NOTIFICATION_LIMIT = 300;

async function addInAppNotification(userId: string, payload: NotificationPayload, projectId?: string): Promise<void> {
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const now = new Date().toISOString();

    const newNotification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: userId,
        projectId: projectId,
        message: payload.body,
        timestamp: now,
        isRead: false,
    };

    notifications.unshift(newNotification);
    if (notifications.length > NOTIFICATION_LIMIT) {
        notifications.pop();
    }
    await writeDb(NOTIFICATION_DB_PATH, notifications);
}


async function triggerSendNotification(userIds: string[], payload: NotificationPayload): Promise<void> {
    const apiPayload: SendNotificationApiPayload = { userIds, payload };
    try {
        // We use an absolute URL here for fetch within Server Components/Actions
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000';
        const response = await fetch(`${host}/api/send-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload),
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `API returned status ${response.status}`);
        }
        
        console.log(`[NotificationService] Successfully delegated notification sending to API route for ${userIds.length} user(s).`);

    } catch (error) {
        console.error('[NotificationService] Failed to trigger send-notification API:', error);
    }
}


export async function notifyUsersByRole(roles: string | string[], payload: NotificationPayload, projectId?: string): Promise<void> {
    const allUsers = await getAllUsersForDisplay();
    const rolesToNotifyArray = Array.isArray(roles) ? roles : [roles];
    const userIdsToNotify = new Set<string>();

    rolesToNotifyArray.forEach(roleToNotify => {
        const normalizedRole = roleToNotify.trim().toLowerCase();
        allUsers.forEach(user => {
            if (user.role.trim().toLowerCase() === normalizedRole) {
                userIdsToNotify.add(user.id);
            }
        });
    });

    if (userIdsToNotify.size === 0) {
        console.warn(`[NotificationService] No users found for role(s): ${rolesToNotifyArray.join(', ')}`);
        return;
    }

    const uniqueUserIds = Array.from(userIdsToNotify);

    // Create in-app notifications first
    for (const userId of uniqueUserIds) {
        await addInAppNotification(userId, payload, projectId);
    }
    
    // Then, delegate the push notification sending
    await triggerSendNotification(uniqueUserIds, payload);
}

export async function notifyUserById(userId: string, payload: NotificationPayload, projectId?: string): Promise<void> {
    if (!userId) return;
    
    await addInAppNotification(userId, payload, projectId);
    await triggerSendNotification([userId], payload);
}

// --- Functions for managing notification history and subscriptions ---

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    const allNotifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    return allNotifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);

    if (notificationIndex !== -1 && !notifications[notificationIndex].isRead) {
        notifications[notificationIndex].isRead = true;
        await writeDb(NOTIFICATION_DB_PATH, notifications);
    }
}

export async function deleteNotificationsByProjectId(projectId: string): Promise<void> {
    if (!projectId) return;
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const filtered = notifications.filter(n => n.projectId !== projectId);
    if (notifications.length !== filtered.length) {
        await writeDb(NOTIFICATION_DB_PATH, filtered);
    }
}

export async function clearAllNotifications(): Promise<void> {
    await writeDb(NOTIFICATION_DB_PATH, []);
}
