**# Event Vendor Access Management System

## Overview

The Event Vendor Access Management System is a web-based Progressive Web App (PWA) designed to efficiently manage vendor and employee access control during events. It streamlines the process of creating vendor profiles, managing employee entries, verifying gate access, and maintaining attendance and access history — all in one unified platform accessible from both desktop and mobile devices.

---

## Key Features

### 1. Admin Dashboard

The admin oversees all vendors and their associated employees through a central dashboard that provides full visibility and control over event access.

Capabilities:

* Create, edit, or remove vendors.
* Set vendor-specific parameters such as:

  * Vendor name
  * Image/logo
  * Allowed employee count
  * Assigned gate
  * Location
  * Additional information
* Monitor real-time access logs and employee attendance.
* Approve or manage replacements for employees without changing their QR code.

Illustration:

![]()

---

### 2. Vendor Management

Each vendor is created by the admin and provided a secure link to register their employees. This ensures only authorized personnel are added and within the allowed quota.

Vendor Details:

* Name and image
* Number of allowed employees
* Assigned gate
* Designated location
* General information about the vendor

---

### 3. Employee Registration

Vendors use their unique link to register employees according to their quota. Each employee profile contains essential details used for identification and access validation.

Employee Details:

* Name and profile image
* ID card image
* Business name or role
* Working days and assigned hours for each day

Upon creation, the system automatically generates a QR code and a personalized PDF pass for each employee containing their information and photo, which can be printed for physical identification.

Illustration:

![]()

---

### 4. Usher App (Access Verification)

Usher staff will use a mobile-friendly PWA designed for scanning employee QR codes at event gates.

Process:

1. The usher selects the gate they are stationed at when logging in.
2. They scan an employee's QR code.
3. The system validates the following in real-time:

   * Gate authorization (matching gate assignment)
   * Current time within the employee’s working schedule
4. The app displays one of the following responses:

* ✅ Access Granted
* ❌ Access Denied (with reason, e.g., wrong gate or outside working hours)

All scans are recorded as access logs linked to each employee.

Illustration:

![]()

---

### 5. Access Logs and History

Every scan is logged for auditing and reporting purposes. The dashboard includes:

* Time-stamped logs for all entries and exits.
* Real-time employee on-site tracking.
* Filtering by vendor, gate, or employee.

---

### 6. Employee Replacement & Version Control

If an employee is replaced, the admin or vendor can update the employee’s information (e.g., new name or image) while retaining the same QR code. This ensures seamless transitions and prevents confusion during events.

Benefits:

* No need to reprint or redistribute new QR passes.
* Historical data is preserved with version control.

---

### 7. Progressive Web App (PWA)

The entire system is built as a PWA, ensuring:

* Access via browsers or installable app on both phones and laptops.
* Full responsiveness for on-site use.
* Offline-ready features for areas with limited connectivity.

---

## Technical Summary

* Platform: Web-based mobile App
* Accessibility: Android/iOS and desktop
* Authentication: Secure vendor and usher login system
* PDF Generation: Automated pass creation via system template
* QR Verification: Real-time scan validation via usher portal

---

## Summary Diagram

High-Level System Flow:

1. Admin creates vendors.
2. Vendors register employees.
3. System generates employee passes (QR + PDF).
4. Ushers scan and verify access at gates.
5. Dashboard updates logs and attendance in real time.

---

## Conclusion

The Event Vendor Access Management System provides a complete, efficient, and mobile-first solution to handle event access control for vendors and their employees. Its robust verification features, intuitive dashboard, and PWA capabilities make it the ideal tool for ensuring smooth operations and secure access during any event.

**
