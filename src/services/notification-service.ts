
// src/services/notification-service.ts
'use server';

import * as path from 'path';
import type { User } from '@/types/user-types';
import { getAllUsers } from './data-access/user-data';
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

// Configure web-push with VAPID details from environment variables
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    webPush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID keys not configured. Push notifications will not work.");
}


async function findUsersByRole(role: string): Promise<User[]> {
    const allUsers = await getAllUsers();
    const normalizedRole = role.trim().toLowerCase();
    return allUsers.filter(user => user.role.trim().toLowerCase() === normalizedRole);
}

async function sendPushNotification(subscription: PushSubscription, payload: string) {
    try {
        await webPush.sendNotification(subscription, payload);
    } catch (error: any) {
        console.error(`Failed to send push notification to ${subscription.endpoint}. Error: ${error.message}`);
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('Subscription expired or invalid. Removing...');
            await removeSubscription(subscription);
        }
    }
}

async function notifyUser(user: User, payload: NotificationPayload, projectId?: string): Promise<void> {
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
    
    // **CRITICAL FIX**: Convert the payload object to a JSON string before sending.
    const pushPayloadString = JSON.stringify(payload);
    
    for (const subRecord of userSubscriptions) {
        await sendPushNotification(subRecord.subscription, pushPayloadString);
    }
}

export async function notifyUsersByRole(roles: string | string[], payload: NotificationPayload, projectId?: string): Promise<void> {
    const rolesToNotify = Array.isArray(roles) ? roles : [roles];
    if (rolesToNotify.length === 0 || rolesToNotify.every(r => !r)) return;

    const usersToNotify = new Map<string, User>();
    for (const role of rolesToNotify) {
        if (!role) continue;
        const targetUsers = await findUsersByRole(role);
        targetUsers.forEach(user => usersToNotify.set(user.id, user));
    }
    
    for (const user of usersToNotify.values()) {
        await notifyUser(user, payload, projectId);
    }
}

export async function notifyUserById(userId: string, payload: NotificationPayload, projectId?: string): Promise<void> {
    if (!userId) return;
    const allUsers = await getAllUsers();
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        await notifyUser(user, payload, projectId);
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

// --- Subscription Management ---

export async function saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const subscriptions = await readDb<SubscriptionRecord[]>(SUBSCRIPTION_DB_PATH, []);
    const existingIndex = subscriptions.findIndex(s => s.subscription.endpoint === subscription.endpoint);

    const newRecord: SubscriptionRecord = { userId, subscription };

    if (existingIndex > -1) {
        subscriptions[existingIndex] = newRecord; // Update if exists
    } else {
        subscriptions.push(newRecord); // Add if new
    }

    await writeDb(SUBSCRIPTION_DB_PATH, subscriptions);
    console.log(`Subscription saved for user ${userId}.`);
}

async function removeSubscription(subscription: PushSubscription): Promise<void> {
    const subscriptions = await readDb<SubscriptionRecord[]>(SUBSCRIPTION_DB_PATH, []);
    const updatedSubscriptions = subscriptions.filter(s => s.subscription.endpoint !== subscription.endpoint);
    await writeDb(SUBSCRIPTION_DB_PATH, updatedSubscriptions);
    console.log(`Subscription removed: ${subscription.endpoint}`);
}
