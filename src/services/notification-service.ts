// src/services/notification-service.ts
'use server';

import * as path from 'path';
import type { User } from '@/types/user-types';
import { getAllUsersForDisplay } from './user-service';
import { readDb, writeDb } from '@/lib/database-utils';
import webPush, { type PushSubscription } from 'web-push';

export interface Notification {
    id: string;
    userId: string;
    projectId?: string;
    message: string;
    timestamp: string;
    isRead: boolean;
}

interface SubscriptionRecord {
    userId: string;
    subscription: PushSubscription;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

const NOTIFICATION_DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'notifications.json');
const SUBSCRIPTION_DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'subscriptions.json');
const NOTIFICATION_LIMIT = 300;

if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    webPush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID keys not configured. Push notifications will not work.");
}

async function sendPushNotification(subscription: PushSubscription, payload: string) {
    try {
        await webPush.sendNotification(subscription, payload);
    } catch (error: any) {
        console.error(`[PushService] Failed to send push notification. Error: ${error.message}`);
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[PushService] Subscription expired or invalid. Removing...');
            await removeSubscription(subscription);
        }
    }
}

async function notifyUser(user: Omit<User, 'password'>, payload: NotificationPayload, projectId?: string): Promise<void> {
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const now = new Date().toISOString();

    const newNotification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
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

    const subscriptions = await readDb<SubscriptionRecord[]>(SUBSCRIPTION_DB_PATH, []);
    const userSubscriptions = subscriptions.filter(sub => sub.userId === user.id);

    if (userSubscriptions.length > 0) {
        const pushPayloadString = JSON.stringify(payload);
        for (const subRecord of userSubscriptions) {
            await sendPushNotification(subRecord.subscription, pushPayloadString);
        }
    }
}

async function findUsersByRole(role: string): Promise<Omit<User, 'password'>[]> {
    const allUsers = await getAllUsersForDisplay();
    const normalizedRole = role.trim().toLowerCase();
    // CRITICAL FIX: Ensure both sides of the comparison are lowercased.
    return allUsers.filter(user => user.role.trim().toLowerCase() === normalizedRole);
}

export async function notifyUsersByRole(roles: string | string[], payload: NotificationPayload, projectId?: string): Promise<void> {
    const rolesToNotifyArray = Array.isArray(roles) ? roles : [roles];
    if (rolesToNotifyArray.length === 0) return;

    const uniqueUsersToNotify = new Map<string, Omit<User, 'password'>>();
    
    for (const role of rolesToNotifyArray) {
        const foundUsers = await findUsersByRole(role);
        foundUsers.forEach(user => uniqueUsersToNotify.set(user.id, user));
    }

    if (uniqueUsersToNotify.size === 0) {
        console.warn(`[NotificationService] No users found for role(s): ${rolesToNotifyArray.join(', ')}`);
        return;
    }
    
    console.log(`[NotificationService] Notifying ${uniqueUsersToNotify.size} user(s) for role(s): ${rolesToNotifyArray.join(', ')}`);
    for (const user of uniqueUsersToNotify.values()) {
        await notifyUser(user, payload, projectId);
    }
}

export async function notifyUserById(userId: string, payload: NotificationPayload, projectId?: string): Promise<void> {
    if (!userId) return;
    const allUsers = await getAllUsersForDisplay();
    const user = allUsers.find(u => u.id === userId);
    
    if (user) {
        await notifyUser(user, payload, projectId);
    } else {
        console.warn(`[NotificationService] Could not find user with ID ${userId} to send notification.`);
    }
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    const allNotifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    return allNotifications.filter(n => n.userId === userId);
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
    const subscriptions = await readDb<SubscriptionRecord[]>(SUBSCRIPTION_DB_PATH, []);
    const existingIndex = subscriptions.findIndex(s => s.subscription.endpoint === subscription.endpoint);

    const newRecord: SubscriptionRecord = { userId, subscription };

    if (existingIndex > -1) {
        subscriptions[existingIndex] = newRecord;
    } else {
        subscriptions.push(newRecord);
    }

    await writeDb(SUBSCRIPTION_DB_PATH, subscriptions);
}

async function removeSubscription(subscription: PushSubscription): Promise<void> {
    const subscriptions = await readDb<SubscriptionRecord[]>(SUBSCRIPTION_DB_PATH, []);
    const updatedSubscriptions = subscriptions.filter(s => s.subscription.endpoint !== subscription.endpoint);
    await writeDb(SUBSCRIPTION_DB_PATH, updatedSubscriptions);
}
