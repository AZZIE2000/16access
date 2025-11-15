# Database Schema Summary

## Overview
This document outlines the complete database schema for the Event Vendor Access Management System, designed to manage vendor and employee access control during events.

---

## Core Models

### 1. **User**
Admin and Usher users who manage the system.

**Fields:**
- `id`, `name`, `username`, `email`, `role`, `password`
- `createdAt`, `updatedAt`

**Relations:**
- Has many `Activity` (scans performed)
- Has many `Alert` (alerts created)

---

### 2. **Vendor**
Companies/vendors participating in the event.

**Fields:**
- `id`, `name`, `description`, `image` (logo)
- `allowedStaffCount` - Maximum employees allowed
- `accessToken` - Unique token for employee registration link
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:**
- Belongs to `Gate` (assigned gate)
- Belongs to `Zone` (designated location)
- Has many `Employee`
- Has many `VendorAttachment` (images/documents)

**Key Features:**
- Secure access token for employee registration
- Soft delete support
- Gate and zone assignment

---

### 3. **Employee**
Vendor staff members with access permissions.

**Fields:**
- `id`, `identifier` (persistent QR identifier)
- `name`, `job`, `description`
- `qrCode` - Generated QR code data
- `pdfUrl` - URL to generated PDF pass
- `version` - Version control for replacements
- `verified` - Approval status
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:**
- Belongs to `Vendor`
- Belongs to `Gate` (assigned gate)
- Has many `WorkingHours`
- Has many `Activity` (access logs)
- Has many `EmployeeAttachment` (ID card, profile photo)
- Has many `EmployeePermission`
- Has many `Alert`

**Key Features:**
- Persistent identifier for QR code (survives replacements)
- Version control for employee replacements
- Soft delete support
- Unique QR code per employee

---

### 4. **Zone**
Physical locations/areas within the event.

**Fields:**
- `id`, `name`, `description`
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:**
- Has many `Vendor`
- Has many `Gate`

---

### 5. **Gate**
Entry/exit points for access control.

**Fields:**
- `id`, `name`, `description`
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:**
- Belongs to `Zone`
- Has many `Vendor`
- Has many `Employee`
- Has many `Activity` (scans at this gate)

---

### 6. **WorkingHours**
Customizable working hours for each employee by day of week.

**Fields:**
- `id`, `dayOfWeek` (enum: MONDAY-SUNDAY)
- `startTime`, `endTime` (format: "HH:mm")
- `isActive` - Whether this day is a working day
- `createdAt`, `updatedAt`

**Relations:**
- Belongs to `Employee`

**Key Features:**
- One entry per employee per day
- Customizable hours for each day
- Enable/disable specific days
- Used for access validation

---

### 7. **Activity**
Access logs for all QR code scans.

**Fields:**
- `id`, `type` (ENTRY/EXIT/DENIED)
- `status` (GRANTED/DENIED)
- `denialReason` - Why access was denied
- `scannedAt` - Timestamp of scan
- `createdAt`, `updatedAt`

**Relations:**
- Belongs to `Employee`
- Belongs to `User` (scanner/usher)
- Belongs to `Gate`
- Has many `Alert`

**Key Features:**
- Complete audit trail
- Tracks entry/exit/denied attempts
- Records denial reasons
- Indexed for fast queries

---

### 8. **Alert**
Flags for unauthorized access attempts or security issues.

**Fields:**
- `id`, `text`, `severity` (info/warning/error)
- `isResolved`, `resolvedAt`
- `createdAt`, `updatedAt`

**Relations:**
- Belongs to `Employee` (optional)
- Belongs to `User` (creator)
- Belongs to `Activity` (triggering event)

**Key Features:**
- Track security incidents
- Resolution tracking
- Severity levels

---

### 9. **Permission**
Access permissions that can be granted to employees.

**Fields:**
- `id`, `name`, `description`
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:**
- Has many `EmployeePermission`

---

### 10. **Attachment**
Files/images stored in the system.

**Fields:**
- `id`, `url`, `key` (storage key)
- `name`, `mimeType`, `size`
- `description`
- `createdAt`, `updatedAt`

**Relations:**
- Has many `VendorAttachment`
- Has many `EmployeeAttachment`

---

## Junction Tables (Many-to-Many)

### 11. **VendorAttachment**
Links vendors to their attachments (logos, documents).

**Fields:**
- `id`, `vendorId`, `attachmentId`
- `createdAt`, `updatedAt`

**Constraints:**
- Unique per vendor-attachment pair
- Cascade delete

---

### 12. **EmployeeAttachment**
Links employees to their attachments with type classification.

**Fields:**
- `id`, `type` (ID_CARD/PROFILE_PHOTO/OTHER)
- `employeeId`, `attachmentId`
- `createdAt`, `updatedAt`

**Key Features:**
- Type classification for different attachment purposes
- Cascade delete

---

### 13. **EmployeePermission**
Links employees to their granted permissions.

**Fields:**
- `id`, `employeeId`, `permissionId`
- `grantedAt`, `expiresAt`
- `createdAt`, `updatedAt`

**Key Features:**
- Optional expiration dates
- Cascade delete

---

## Enums

### Role
- `admin` - System administrator
- `usher` - Gate staff

### DayOfWeek
- `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`

### ActivityType
- `ENTRY` - Employee entered
- `EXIT` - Employee exited
- `DENIED` - Access denied

### AccessStatus
- `GRANTED` - Access allowed
- `DENIED` - Access denied

### EmployeeAttachmentType
- `ID_CARD` - Employee ID card image
- `PROFILE_PHOTO` - Employee profile photo
- `OTHER` - Other documents

---

## Key Business Logic Features

### 1. **Employee Replacement & Version Control**
- `identifier` field persists across replacements
- `version` field tracks replacement history
- QR code remains the same when employee is replaced
- Historical data preserved

### 2. **Access Validation**
The system validates:
- Gate authorization (employee assigned to correct gate)
- Working hours (current time within employee's schedule)
- Employee verification status
- Vendor quota compliance

### 3. **Soft Deletes**
Models with `deletedAt` field:
- `Vendor`, `Zone`, `Gate`, `Permission`, `Employee`

### 4. **Cascade Deletes**
When deleted, automatically removes:
- Vendor → Employees, VendorAttachments
- Employee → WorkingHours, EmployeeAttachments, EmployeePermissions
- Attachment → VendorAttachments, EmployeeAttachments

### 5. **Indexing Strategy**
Optimized indexes for:
- Foreign keys (vendorId, employeeId, gateId, etc.)
- Unique identifiers (qrCode, accessToken)
- Query filters (scannedAt, type)

---

## Next Steps

To apply this schema to your database:

```bash
npx prisma migrate dev --name complete_schema
npx prisma generate
```

This will:
1. Create all tables and relationships
2. Generate the Prisma Client with TypeScript types
3. Apply all constraints and indexes

