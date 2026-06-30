---
title: "Futcamedic"
subtitle: "Multi-Tenant Football Academy Management Platform"
date: "May 5, 2026"
author:
  - name: "Product Team"
    affiliation: "Futcamedic"
---

## Product Definition: Futcamedic

### The One-Sentence Definition
A web and mobile application where football academy owners log in to manage students, track attendance, collect payments, and schedule training sessions across multiple categories and venues.

### Product Type
**Tool** — Users access the software via web or mobile app and perform daily operations.

### The Buyer
- **Who**: Football academy owner or director, managing 50-500 students across 4-12 categories, employing 5-20 teachers, operating 1-5 venues
- **Before**: Used paper notebooks for attendance, WhatsApp groups for scheduling, manual cash collection for payments, Excel sheets for student records, phone calls to notify parents
- **After**: Logs into a unified dashboard on Day 30, sees real-time attendance rates, payment status of all students, upcoming training sessions, and sends automated push notifications to parents — all from a mobile phone

### Day-1 Experience
1. Academy owner registers school at `/register` with school name, full name, email, password
2. Receives email confirmation from Supabase Auth
3. Logs in at `/login` with credentials
4. Changes temporary password (if invited) or proceeds directly (if owner)
5. Creates first category (e.g., "U-12") by selecting birth year range
6. Invites first teacher via email (system sends invite with temporary password)
7. Adds first 5-10 students to the category with parent contact info
8. Schedules first training session with date, time, venue, and category

### What They Receive
- **Web access**: React web app at `web/` with full admin capabilities
- **Mobile access**: Expo React Native app for iOS/Android with role-based tabs
- **Multi-tenant isolation**: Each school's data completely separated via `school_id`
- **Push notifications**: Automated alerts to parents when payments are recorded
- **Storage**: Supabase Storage bucket for student profile photos
- **Export capabilities**: PDF and Excel reports for payments and attendance

### What They Do NOT Have to Do
- Manually calculate attendance percentages (system computes automatically)
- Send individual payment reminders (bulk registration with auto-notify)
- Track which teacher manages which category (system assigns and filters)
- Worry about other schools seeing their data (RLS enforces isolation)
- Build recurring events manually each week (recurrence engine generates sessions)

### What They Still Have To Do
- Input student data manually (no bulk CSV import yet)
- Collect cash/transfers outside the system (payment recording is manual entry)
- Verify teacher attendance taking (no GPS/location validation)
- Manage parent communications beyond payment notifications
- Handle student medical emergencies (system stores info but doesn't alert)

### Evidence Status

| Claim | Evidence | Status |
|-------|----------|--------|
| Users can register a school and start using the system in 10 minutes | Code review of `auth.controller.ts` register flow + `register.tsx` | Verified |
| Teachers can take attendance for their assigned categories only | `requireTenant` middleware + `attendance.controller.ts` category filter | Verified |
| Parents only see their own children's data | `student.controller.ts` parent filter + RLS policies | Verified |
| Payment registration sends push notifications to parents | `payment.controller.ts` calls `sendPushNotification` | Verified |
| Recurring events generate multiple training sessions | `event.controller.ts` recurrence logic (weekly, biweekly, monthly) | Verified |

### Open Questions
- How does the academy handle failed push notification deliveries?
- What happens when a teacher is removed from a category mid-season?
- Is there a need for payment receipt generation (PDF receipt with academy logo)?
- Should the system support multiple parent contacts per student?
- What is the expected churn rate after 90 days?
