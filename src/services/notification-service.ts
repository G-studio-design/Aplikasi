// src/services/notification-service.ts
'use server';

import * as path from 'path';
import webPush, { type PushSubscription } from 'web-push';
import { getAllUsers } from './data-access/user-data';
import { readDb, writeDb } from '@/lib/database-utils';

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

const NOTIFICATION_DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'notifications.json');
const SUBSCRIPTION_DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'subscriptions.json');
const NOTIFICATION_LIMIT = 300;

// Initialize VAPID keys once when the module is loaded.
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    try {
        webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } catch (error) {
        console.error("[NotificationService] CRITICAL: Failed to load VAPID keys. Push notifications will fail.", error);
    }
} else {
    console.error("[NotificationService] CRITICAL: VAPID keys are not configured in environment variables. Push notifications will fail.");
}

async function sendPushNotification(subscription: PushSubscription, payloadString: string) {
    try {
        await webPush.sendNotification(subscription, payloadString);
        console.log(`[NotificationService] Push notification sent successfully to endpoint: ${subscription.endpoint.slice(0, 50)}...`);
    } catch (error: any) {
        console.error(`[NotificationService] Failed to send push. Status: ${error.statusCode}, Message: ${error.message}`);
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[NotificationService] Subscription expired or invalid. It should be removed.');
        }
    }
}

async function addInAppNotifications(userIds: string[], payload: NotificationPayload, projectId?: string): Promise<void> {
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const now = new Date().toISOString();

    for (const userId of userIds) {
        const newNotification: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId: userId,
            projectId: projectId,
            message: payload.body,
            timestamp: now,
            isRead: false,
        };
        notifications.unshift(newNotification);
    }
    
    if (notifications.length > NOTIFICATION_LIMIT) {
        notifications.splice(NOTIFICATION_LIMIT);
    }
    
    await writeDb(NOTIFICATION_DB_PATH, notifications);
}

async function findUsersByRole(roles: string[]): Promise<string[]> {
    const allUsers = await getAllUsers();
    const normalizedRoles = roles.map(r => r.trim().toLowerCase());
    
    const userIds = allUsers
        .filter(user => normalizedRoles.includes(user.role.trim().toLowerCase()))
        .map(user => user.id);

    console.log(`[NotificationService] Found ${userIds.length} user(s) for roles: ${roles.join(', ')}`);
    return userIds;
}

export async function notifyUsersByRole(roles: string | string[], payload: NotificationPayload, projectId?: string): Promise<void> {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    const userIdsToNotify = await findUsersByRole(rolesArray);

    if (userIdsToNotify.length === 0) {
        console.warn(`[NotificationService] No users found for role(s): ${rolesArray.join(', ')}. Aborting notification.`);
        return;
    }
    
    await addInAppNotifications(userIdsToNotify, payload, projectId);
    
    const allSubscriptions = await readDb<{ userId: string, subscription: PushSubscription }[]>(SUBSCRIPTION_DB_PATH, []);
    const targetSubscriptions = allSubscriptions.filter(sub => userIdsToNotify.includes(sub.userId));

    if (targetSubscriptions.length === 0) {
        console.log(`[NotificationService] No push subscriptions found for the target user(s).`);
        return;
    }
    
    const pushPayload = JSON.stringify({
        notification: {
            title: payload.title,
            body: payload.body,
            data: { url: payload.url || '/' }
        }
    });

    await Promise.all(
        targetSubscriptions.map(subRecord => 
            sendPushNotification(subRecord.subscription, pushPayload)
        )
    );
}

export async function notifyUserById(userId: string, payload: NotificationPayload, projectId?: string): Promise<void> {
    if (!userId) return;
    await notifyUsersByRole([userId], payload, projectId);
}


// --- Functions for managing notification history ---

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

export async function saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const allSubscriptions = await readDb<{userId: string, subscription: PushSubscription}[]>(SUBSCRIPTION_DB_PATH, []);
    const filteredSubscriptions = allSubscriptions.filter(s => s.userId !== userId);
    filteredSubscriptions.push({ userId, subscription });
    await writeDb(SUBSCRIPTION_DB_PATH, filteredSubscriptions);
}
