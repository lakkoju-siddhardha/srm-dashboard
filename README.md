# SRM Dashboard & Automated Attendance System

## Overview

SRM Dashboard is a full-stack web application built to simplify academic workflows for students of **SRM University AP**. The project provides a modern dashboard interface where students can securely log in, view profile information, submit attendance codes, and access academic utilities without repeatedly navigating the official SRM student portal.

This project was developed to solve the inconvenience of the existing SRM portal, which requires multiple manual steps for common tasks such as attendance submission.

---

## Problem Statement

The official SRM student portal is functional but cumbersome for day-to-day use. To submit attendance, students typically need to:

1. Open the SRM portal
2. Enter register number and password
3. Solve captcha
4. Navigate through multiple menu layers
5. Open attendance section
6. Enter attendance code manually

This process becomes repetitive and time-consuming.

---

## Solution

This project automates and simplifies the workflow by providing:

* A modern custom dashboard UI
* Secure login and session management
* One-click attendance code submission
* Automated SRM portal navigation
* Profile data extraction
* Attendance analytics and utilities

The dashboard acts as a smart wrapper around the SRM portal while hiding unnecessary complexity from users.

---

## Features

### Authentication System

* Student registration
* Secure login
* Session-based authentication
* Logout support

Passwords are hashed before storage for security.

---

### Secure Credential Storage

The application securely stores:

* Website login password (hashed using bcrypt)
* SRM portal password (encrypted using AES)

This allows backend automation while protecting sensitive credentials.

---

### Automated SRM Login

The system automatically logs into the SRM portal by:

* Opening SRM portal
* Filling register number
* Filling password
* Capturing captcha image
* Solving captcha using OCR
* Logging into student dashboard

This eliminates repetitive manual login steps.

---

### Captcha Recognition (OCR)

Captcha solving pipeline:

1. Screenshot captcha image
2. Preprocess using Sharp
3. Resize image
4. Convert to grayscale
5. Apply threshold filtering
6. Extract text using Tesseract OCR

This improves captcha recognition accuracy.

---

### Attendance Code Submission

Students can directly submit attendance codes from the custom dashboard.

Automation flow:

* Receive attendance code from dashboard
* Open SRM portal session
* Navigate to attendance section
* Fill attendance code
* Submit automatically

This reduces attendance submission to a single action.

---

### Profile Integration

Student profile information is fetched from the SRM portal and displayed inside dashboard.

Profile includes:

* Student name
* Register number
* Semester
* Program / branch
* Avatar initials

---

### Modern Dashboard UI

Built a fully redesigned dashboard with:

* Dark modern theme
* Sidebar navigation
* Responsive layout
* Hero profile section
* Attendance widgets
* Academic utilities

Unnecessary portal clutter was removed for better usability.

---

### Academic Utilities

Implemented / planned utilities:

* Attendance code submission
* Bunk calculator
* Timetable viewer
* Attendance analytics

Some features are pending due to lack of live semester data during holidays.

---

## Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Automation & OCR

* Playwright
* Tesseract.js
* Sharp

### Security & Sessions

* bcrypt
* crypto (AES encryption)
* express-session

---

## Project Architecture

```text
User
 ↓
Custom Dashboard UI
 ↓
Express Backend
 ↓
Database + Automation Engine
 ↓
SRM Student Portal
```

---

## Database Schema

### Users Table

Stores:

* reg_no
* password (hashed)
* srm_password (encrypted)

Example:

```sql
CREATE TABLE users (
    reg_no VARCHAR(20) PRIMARY KEY,
    password TEXT NOT NULL,
    srm_password TEXT NOT NULL
);
```

---

## Security Measures

### Password Hashing

Website passwords are hashed using bcrypt:

* Prevents plain text storage
* Improves user security

### AES Encryption

SRM credentials are encrypted before database storage.

### Session Authentication

Implemented using express-session.

Protects:

* dashboard routes
* profile routes
* attendance submission routes

---

## Challenges Faced

### Captcha Automation

Captcha solving was the most difficult challenge because captcha is specifically designed to block automation.

Challenges included:

* noisy captcha images
* OCR misreads
* varying character shapes

---

### Session Expiry

SRM sessions automatically expire after inactivity.

This required:

* session persistence
* reauthentication logic
* automatic relogin

---

### Portal Reverse Engineering

Understanding SRM portal structure required:

* DOM inspection
* element locator debugging
* route inspection
* automation testing

---

## Future Improvements

Planned improvements:

* Deploy online for public use
* Mobile app version
* Better OCR accuracy
* AI study assistant
* Notification system
* Attendance prediction
* Smart bunk planner

---

## Learning Outcomes

This project helped strengthen knowledge in:

* Full-stack web development
* Database design
* Browser automation
* OCR pipelines
* Session management
* Authentication systems
* UI/UX design
* Debugging real-world systems

---

## Use Cases

Useful for SRM students who want to:

* save time
* avoid repeated portal navigation
* manage attendance better
* access academic information from a cleaner interface

---



## Installation

Clone repository:

```bash
git clone <repo-url>
```

Install dependencies:

```bash
npm install
```

Create `.env`:

```env
PORT=5000
SESSION_SECRET=your_secret
ENCRYPTION_KEY=your_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=srm_dashboard
```

Run server:

```bash
node server.js
```

Open:

```text
http://localhost:5000
```

---

## Author

**Lakkoju Siddhardha**
B.Tech CSE — SRM University AP

GitHub: https://github.com/lakkoju-siddhardha
