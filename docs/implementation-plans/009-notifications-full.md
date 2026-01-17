# 009: Full Notifications System

**Priority:** Future/Backlog  
**Effort:** L (1-2 days)  
**Status:** Not Started

## Overview

Implement a complete notifications system with price alerts and real-time updates. This is the full implementation following the cleanup in plan 004.

## Features

- Price alerts (notify when item reaches target price)
- System notifications (new items, API status)
- Notification center/panel
- Browser push notifications (optional)
- Notification preferences

## Tasks

### 9.1 Create Notifications Store
- **Location:** `frontend/src/stores/useNotificationsStore.ts`
- **State:**
  - `notifications: Notification[]`
  - `unreadCount: number`
  - `alerts: PriceAlert[]`
- **Actions:**
  - `addNotification`, `markAsRead`, `clearAll`
  - `addAlert`, `removeAlert`, `checkAlerts`

### 9.2 Create Notification Types
- **Location:** `frontend/src/types/notifications.ts`
```tsx
interface Notification {
  id: string;
  type: 'price_alert' | 'system' | 'info';
  title: string;
  message: string;
  itemId?: number;
  timestamp: Date;
  read: boolean;
}

interface PriceAlert {
  id: string;
  itemId: number;
  itemName: string;
  condition: 'above' | 'below';
  targetPrice: number;
  enabled: boolean;
}
```

### 9.3 Create NotificationCenter Component
- **Location:** `frontend/src/components/notifications/NotificationCenter.tsx`
- **Features:**
  - Dropdown panel from header bell icon
  - List of recent notifications
  - Mark as read / Clear all
  - Link to full notifications page

### 9.4 Create PriceAlertModal Component
- **Location:** `frontend/src/components/notifications/PriceAlertModal.tsx`
- **Features:**
  - Set target price
  - Choose above/below condition
  - Enable/disable alert

### 9.5 Add Alert Button to Item Detail
- **File:** `frontend/src/pages/ItemDetailPage.tsx`
- **Change:** Add "Set Price Alert" button

### 9.6 Implement Alert Checking
- **Location:** `frontend/src/hooks/usePriceAlerts.ts`
- **Behavior:** Check alerts when prices update, trigger notification

### 9.7 Add Browser Notifications (Optional)
- **Location:** `frontend/src/utils/browserNotifications.ts`
- **Features:**
  - Request permission
  - Show native notifications
  - Respect user preferences

### 9.8 Create Notifications Settings Section
- **File:** `frontend/src/pages/SettingsPage.tsx`
- **Add:** Notification preferences (sounds, browser notifications, etc.)

## Components to Create

```
frontend/src/components/notifications/
├── NotificationCenter.tsx
├── NotificationItem.tsx
├── PriceAlertModal.tsx
├── AlertsList.tsx
└── index.ts

frontend/src/stores/
└── useNotificationsStore.ts

frontend/src/hooks/
└── usePriceAlerts.ts

frontend/src/types/
└── notifications.ts
```

## Testing

- [ ] Can create price alerts
- [ ] Alerts trigger when conditions met
- [ ] Notifications appear in center
- [ ] Unread count updates correctly
- [ ] Can clear/dismiss notifications
- [ ] Browser notifications work (if enabled)
- [ ] Alerts persist across sessions

## Dependencies

- Plan 003 (Settings Page) - for notification preferences
- Plan 007 (Favorites) - similar UI patterns
- SSE or polling for real-time checks

## Design Notes

- Use Sonner for toast notifications
- Bell icon shows unread count badge
- Slide-out panel for notification center
- Color-code by notification type
