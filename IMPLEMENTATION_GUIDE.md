# Implementation Guide

## Schema Completion Summary

The database schema has been fully completed based on the BRD requirements. Here's what was added and updated:

---

## ✅ Completed Changes

### 1. **Enhanced User Model**
- Added `createdAt` and `updatedAt` timestamps
- Added relations to `Activity` and `Alert`

### 2. **Enhanced Vendor Model**
- ✅ Added `image` field for vendor logo
- ✅ Added `allowedStaffCount` for employee quota management
- ✅ Added `accessToken` for secure employee registration links
- ✅ Added relations to `Gate` and `Zone`
- ✅ Added `employees` relation
- ✅ Added `vendorAttachments` for many-to-many attachments
- ✅ Added soft delete support with `deletedAt`

### 3. **Enhanced Zone Model**
- ✅ Added `description` field
- ✅ Added relations to `Vendor` and `Gate`
- ✅ Added soft delete support

### 4. **Enhanced Gate Model**
- ✅ Added `description` field
- ✅ Added relation to `Zone`
- ✅ Added relations to `Vendor`, `Employee`, and `Activity`
- ✅ Added soft delete support

### 5. **Enhanced Permission Model**
- ✅ Added `description` field
- ✅ Added relation to `EmployeePermission`
- ✅ Added soft delete support

### 6. **Completely Rebuilt Employee Model**
- ✅ Added `identifier` - Persistent QR identifier (survives replacements)
- ✅ Added `qrCode` - Generated QR code data
- ✅ Added `pdfUrl` - URL to generated PDF pass
- ✅ Added `version` - Version control for employee replacements
- ✅ Removed `staffCount` (not needed for employees)
- ✅ Added `vendorId` relation (employees belong to vendors)
- ✅ Added `gateId` relation (assigned gate)
- ✅ Added relations to all related models
- ✅ Added soft delete support

### 7. **Working Hours Table** ✨ NEW
- ✅ Fully implemented with customizable hours per day
- ✅ `dayOfWeek` enum (MONDAY-SUNDAY)
- ✅ `startTime` and `endTime` in "HH:mm" format
- ✅ `isActive` flag to enable/disable days
- ✅ Unique constraint per employee per day
- ✅ Used for access permission validation

### 8. **Enhanced Alert Model**
- ✅ Added `severity` field (info/warning/error)
- ✅ Added `isResolved` and `resolvedAt` for tracking
- ✅ Added relations to `Employee`, `User`, and `Activity`
- ✅ Added indexes for performance

### 9. **Completely Rebuilt Activity Model**
- ✅ Added `type` enum (ENTRY/EXIT/DENIED)
- ✅ Added `status` enum (GRANTED/DENIED)
- ✅ Added `denialReason` for tracking why access was denied
- ✅ Added `scannedAt` timestamp
- ✅ Added `gateId` relation (where scan occurred)
- ✅ Added relation to `Alert`
- ✅ Removed generic `name` and `description` fields
- ✅ Added comprehensive indexes

### 10. **Enhanced Attachment Model**
- ✅ Added `mimeType` field
- ✅ Added `size` field (in bytes)
- ✅ Added relations to junction tables
- ✅ Renamed `type` to avoid confusion

### 11. **VendorAttachment Junction Table** ✨ NEW
- ✅ Many-to-many relationship between Vendor and Attachment
- ✅ Cascade delete support
- ✅ Unique constraint per vendor-attachment pair

### 12. **EmployeeAttachment Junction Table** ✨ NEW
- ✅ Many-to-many relationship between Employee and Attachment
- ✅ Added `type` field (ID_CARD/PROFILE_PHOTO/OTHER)
- ✅ Cascade delete support
- ✅ Unique constraint per employee-attachment pair

### 13. **EmployeePermission Junction Table** ✨ NEW
- ✅ Many-to-many relationship between Employee and Permission
- ✅ Added `grantedAt` timestamp
- ✅ Added `expiresAt` for time-limited permissions
- ✅ Cascade delete support

---

## 📊 New Enums

1. **DayOfWeek** - MONDAY through SUNDAY
2. **ActivityType** - ENTRY, EXIT, DENIED
3. **AccessStatus** - GRANTED, DENIED
4. **EmployeeAttachmentType** - ID_CARD, PROFILE_PHOTO, OTHER

---

## 🔗 Complete Relationship Map

### User
- Has many Activity (as scanner)
- Has many Alert (as creator)

### Vendor
- Belongs to Gate (assigned gate)
- Belongs to Zone (location)
- Has many Employee
- Has many VendorAttachment

### Zone
- Has many Vendor
- Has many Gate

### Gate
- Belongs to Zone
- Has many Vendor
- Has many Employee
- Has many Activity

### Employee
- Belongs to Vendor
- Belongs to Gate (assigned)
- Has many WorkingHours
- Has many Activity
- Has many EmployeeAttachment
- Has many EmployeePermission
- Has many Alert

### Activity
- Belongs to Employee
- Belongs to User (scanner)
- Belongs to Gate
- Has many Alert

### Alert
- Belongs to Employee (optional)
- Belongs to User (creator)
- Belongs to Activity (optional)

### Permission
- Has many EmployeePermission

### Attachment
- Has many VendorAttachment
- Has many EmployeeAttachment

---

## 🚀 Next Steps

### 1. Run Database Migration

```bash
# Generate and apply the migration
npx prisma migrate dev --name complete_schema

# Generate Prisma Client
npx prisma generate
```

### 2. Seed Initial Data (Optional)

Create a seed file to populate initial data:

```typescript
// prisma/seed.ts
import { PrismaClient, Role } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      role: Role.admin,
      password: 'hashed_password_here', // Use bcrypt in production
    },
  });

  // Create zones
  const mainZone = await prisma.zone.create({
    data: {
      name: 'Main Event Area',
      description: 'Primary event location',
    },
  });

  // Create gates
  const gate1 = await prisma.gate.create({
    data: {
      name: 'Gate A',
      description: 'Main entrance',
      zoneId: mainZone.id,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 3. Update package.json

Add seed script:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 4. Implement Business Logic

Key features to implement:

#### A. Vendor Registration Flow
```typescript
// Create vendor with access token
const vendor = await prisma.vendor.create({
  data: {
    name: 'Vendor Name',
    allowedStaffCount: 10,
    gateId: 'gate_id',
    zoneId: 'zone_id',
  },
});

// Share link: /register/${vendor.accessToken}
```

#### B. Employee Registration
```typescript
// Register employee under vendor
const employee = await prisma.employee.create({
  data: {
    name: 'John Doe',
    job: 'Security Staff',
    vendorId: vendor.id,
    gateId: gate.id,
    // Generate QR code and PDF here
    qrCode: generateQRCode(),
    pdfUrl: generatePDF(),
  },
});

// Add working hours
await prisma.workingHours.createMany({
  data: [
    {
      employeeId: employee.id,
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
    },
    // ... other days
  ],
});

// Add attachments
await prisma.employeeAttachment.create({
  data: {
    employeeId: employee.id,
    attachmentId: idCardAttachment.id,
    type: 'ID_CARD',
  },
});
```

#### C. Access Validation
```typescript
async function validateAccess(qrCode: string, gateId: string) {
  const employee = await prisma.employee.findUnique({
    where: { qrCode },
    include: {
      workingHours: true,
      gate: true,
      vendor: true,
    },
  });

  if (!employee) {
    return { status: 'DENIED', reason: 'Invalid QR code' };
  }

  // Check gate
  if (employee.gateId !== gateId) {
    return { status: 'DENIED', reason: 'Wrong gate' };
  }

  // Check working hours
  const now = new Date();
  const dayOfWeek = getDayOfWeek(now); // MONDAY, TUESDAY, etc.
  const currentTime = formatTime(now); // "HH:mm"

  const workingHour = employee.workingHours.find(
    (wh) => wh.dayOfWeek === dayOfWeek && wh.isActive
  );

  if (!workingHour) {
    return { status: 'DENIED', reason: 'Not a working day' };
  }

  if (currentTime < workingHour.startTime || currentTime > workingHour.endTime) {
    return { status: 'DENIED', reason: 'Outside working hours' };
  }

  return { status: 'GRANTED' };
}
```

#### D. Log Activity
```typescript
await prisma.activity.create({
  data: {
    type: 'ENTRY',
    status: result.status,
    denialReason: result.reason,
    employeeId: employee.id,
    scannerId: usher.id,
    gateId: gate.id,
  },
});
```

#### E. Employee Replacement
```typescript
// Update employee while keeping same identifier and QR code
await prisma.employee.update({
  where: { id: employee.id },
  data: {
    name: 'New Employee Name',
    version: { increment: 1 },
    // identifier and qrCode remain the same
  },
});
```

---

## 📝 Important Notes

1. **Soft Deletes**: Models with `deletedAt` should use soft delete queries:
   ```typescript
   // Soft delete
   await prisma.employee.update({
     where: { id },
     data: { deletedAt: new Date() },
   });

   // Query non-deleted
   await prisma.employee.findMany({
     where: { deletedAt: null },
   });
   ```

2. **Vendor Quota**: Validate employee count before creating:
   ```typescript
   const employeeCount = await prisma.employee.count({
     where: { vendorId, deletedAt: null },
   });

   if (employeeCount >= vendor.allowedStaffCount) {
     throw new Error('Vendor quota exceeded');
   }
   ```

3. **QR Code Generation**: Use a library like `qrcode` to generate QR codes
4. **PDF Generation**: Use a library like `pdfkit` or `puppeteer` for PDF passes
5. **Password Hashing**: Always use `bcrypt` or similar for password hashing

---

## 🔒 Security Considerations

1. Hash passwords before storing
2. Validate `accessToken` for employee registration
3. Implement rate limiting on QR scans
4. Add authentication middleware for API routes
5. Validate file uploads for attachments
6. Implement RBAC based on User.role

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [QR Code Generation](https://www.npmjs.com/package/qrcode)
- [PDF Generation](https://www.npmjs.com/package/pdfkit)

