<div align="center">

<img src="Frontend/public/logo_nomzee.png" alt="NOMZEE Logo" width="110" height="110" style="border-radius: 20px;" />

# NOMZEE

### *Order food. Pay securely. Run your restaurant. Manage your platform.*

**A full-stack online food delivery platform built with Spring Boot & React.js**

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apache-maven&logoColor=white)](https://maven.apache.org/)

---

</div>

## 📖 About

**NOMZEE**, full-stack food delivery web application featuring three distinct user roles, a complete restaurant approval workflow, Razorpay test-mode payment with server-side signature verification, admin-controlled platform governance, and a polished dark/light theme system.

Built as a full-stack project, NOMZEE follows a clean three-tier architecture:

-  **Presentation Layer** — React.js 18 + Vite 5 with CSS variable theming
-  **Business Logic Layer** — Spring Boot 3.x REST API (25+ endpoints)
-  **Data Layer** — MySQL 8.0 via Spring Data JPA / Hibernate (7 tables)

---

##  Features

###  For Customers
- Register and log in as a **CUSTOMER**
- Browse the full menu with live **search** across food name, restaurant, and description
- **Add to cart** with quantity controls (+/− per item, reset after each add)
- View order summary
- Pay securely via **Razorpay test-mode** — card, UPI, netbanking
- Server-side **HMAC SHA256 signature verification** before order placement
- Track orders with an **animated 4-step progress tracker**
  - Order Placed → Preparing → On the Way (10 min) → Delivered (20 min)
- View full **order history** with item breakdown and payment ID
- Food items from **blocked restaurants** show as unavailable automatically

###  For Restaurant Owners (BUSINESS)
- Register and log in as a **BUSINESS** user
- Submit restaurants for **admin approval** — starts as PENDING
- Dashboard shows real-time status: **PENDING / APPROVED / REJECTED / BLOCKED**
- Food items can only be added to **APPROVED** restaurants
- Add food items with **drag & drop image upload** (auto-cropped 1:1 via HTML Canvas)
- **Edit** food name, price, description, and image inline
- **Delete** food items with confirmation modal
- **Toggle availability** — instantly greyed out in the customer menu
- **Manage Menu tab** loads ALL your foods from the database (not just current session)
- Strict **owner-filtering** — you can only see and manage your own restaurant's items

###  For Admin
- **Approvals Tab** — Review all restaurant registration requests
  - Approve → restaurant goes APPROVED, owner can now add food
  - Reject → with optional reason stored and shown to owner
- **Users Tab** — View all customers and business owners
  - Block → user gets error on next login, session denied
  - Unblock → restores full access
- **Restaurants Tab** — View all restaurants with owner details
  - Block → all food items of that restaurant become unavailable to customers
  - Unblock → food items restore to normal
  - Approve / Reject PENDING restaurants directly from this tab too
- Role verified from **database on every admin API call** — session cannot be spoofed

###  Theme & UI
- **Dark / Light theme toggle** in the navbar (☀️/🌙 switch)
- Smooth **0.25s CSS variable transitions** across all components
- Theme persists in **localStorage** across page refreshes
- Toast notifications for all user actions
- Fully responsive — desktop and tablet

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, Vite 5, React Router DOM v6 |
| Styling | CSS Custom Properties (variables), Google Fonts |
| HTTP Client | Axios (global `withCredentials: true`) |
| Backend | Spring Boot 3.x, Java 17 |
| ORM | Spring Data JPA, Hibernate |
| Database | MySQL 8.0 |
| Payment | Razorpay Java SDK 1.4.5 + JS Checkout CDN |
| Build Tool | Maven |
| API Testing | Postman (cookie jar enabled) |

---

##  Database Schema

```
user                → id, name, email (UNIQUE), password, role, is_blocked
restaurant          → id, name, address, status (PENDING/APPROVED/REJECTED/BLOCKED), owner_id → user
food_item           → id, name, description, price, imageUrl, restaurant_id → restaurant
cart_item           → id, quantity, food_id → food_item, user_id → user
orders              → id, total, createdAt, user_id → user
restaurant_approval → id, status, adminNote, requestedAt, reviewedAt, restaurant_id, requestedBy_id
payment             → id, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, currency, status, createdAt, user_id
```

---

##  Project Structure

```
nomzee/
│
├── backend/                                   # Spring Boot backend
│   └── src/main/java/com/example/foodapp/
│       ├── config/
│       │   └── CorsConfig.java                # CORS: all paths (/**), credentials allowed
│       ├── controller/
│       │   ├── AuthController.java            # /auth/register, /login, /me
│       │   ├── FoodController.java            # /food/add, /all, /update/{id}, /delete/{id}
│       │   ├── RestaurantController.java      # /restaurant/add, /all, /my
│       │   ├── CartController.java            # /cart/add, /cart/view
│       │   ├── OrderController.java           # /order/place, /order/my
│       │   ├── AdminController.java           # All /admin/* endpoints
│       │   └── PaymentController.java         # /payment/create-order, /payment/verify
│       ├── entity/
│       │   ├── User.java                      # + isBlocked boolean field
│       │   ├── Restaurant.java                # + status field (default PENDING)
│       │   ├── FoodItem.java
│       │   ├── CartItem.java
│       │   ├── Order.java
│       │   ├── RestaurantApproval.java        # approval tracking table
│       │   └── Payment.java                   # Razorpay transaction table
│       ├── repository/                        # Spring Data JPA interfaces
│       │   ├── RestaurantApprovalRepository.java  # findByStatus, findByRestaurantId
│       │   └── PaymentRepository.java         # findByRazorpayOrderId
│       ├── service/ + service/serviceimpl/    # Business logic (FoodServiceImpl checks APPROVED)
│       └── resources/
│           └── application.properties         # DB config + Razorpay keys
│
└── frontend/                                  # React.js frontend
    ├── public/
    │   └── logo_nomzee.png                    # Favicon + navbar logo
    └── src/
        ├── index.css                          # CSS variables dark/light theme system
        ├── App.css                            # Auth pages, layout, toast styles
        ├── App.jsx                            # Root: routing, theme toggle, /auth/me call
        └── components/
            ├── Navbar.jsx                     # Theme toggle switch, role-aware nav, cart badge
            ├── Welcome.jsx                    # Landing hero, stats, featured foods
            ├── AuthPage.jsx                   # Login + Register — calls /auth/me for real role
            ├── MenuPage.jsx                   # Food grid, blocked restaurant detection
            ├── CartPage.jsx                   # Cart + Razorpay payment integration
            ├── OrdersPage.jsx                 # Order history + animated progress tracker
            ├── DashboardPage.jsx              # Business: restaurant, food CRUD, manage menu
            ├── AdminPage.jsx                  # Admin: approvals, users, restaurants (3 tabs)
            └── Footer.jsx                     # Logo, nav links, LinkedIn credits
```

---

##  Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8.0+

---

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nomzee.git
cd nomzee
```

---

### 2. Set Up the Database

```sql
CREATE DATABASE nomzee;
```

---

### 3. Configure the Backend

Open `food-backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/nomzee
spring.datasource.username=root
spring.datasource.password=yourpassword

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Razorpay Test Keys (get free keys at dashboard.razorpay.com)
razorpay.key.id=rzp_test_XXXXXXXXXXXXXXX
razorpay.key.secret=XXXXXXXXXXXXXXXXXXXXXXXX
```

>  Keep `ddl-auto=update` — never use `create-drop` as it wipes data on restart.

---

### 4. Start the Backend

```bash
cd food-backend
mvn spring-boot:run
```

Backend starts at **http://localhost:8080**. Tables auto-created by Hibernate on first run.

---

### 5. Create Admin User

After the backend starts (tables created), run this SQL once:

```sql
INSERT INTO user (name, email, password, role, is_blocked)
VALUES ('Admin', 'admin@nomzee.com', 'admin123', 'ADMIN', 0);
```

> If `is_blocked` column is missing: `ALTER TABLE user ADD COLUMN is_blocked TINYINT(1) DEFAULT 0;`
> If `status` column missing on restaurant: `ALTER TABLE restaurant ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';`

---

### 6. Start the Frontend

```bash
cd rest-api-frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

> Vite proxy auto-forwards all API calls (`/auth`, `/food`, `/cart`, `/order`, `/restaurant`, `/admin`, `/payment`) to `http://localhost:8080`.

---

##  API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register CUSTOMER or BUSINESS | None |
| `POST` | `/auth/login` | Login — creates HTTP session | None |
| `GET` | `/auth/me` | Get real user + role from DB | Session |
| `GET` | `/food/all` | Get all food items | None |
| `POST` | `/food/add` | Add food (APPROVED restaurant only) | Session |
| `PUT` | `/food/update/{id}` | Edit food item | Session |
| `DELETE` | `/food/delete/{id}` | Delete food item | Session |
| `POST` | `/restaurant/add` | Register restaurant → PENDING + approval record | Session |
| `GET` | `/restaurant/all` | Get all restaurants with status | None |
| `GET` | `/restaurant/my` | Get owner's restaurants only | Session |
| `POST` | `/cart/add` | Add `{foodId, qty}` to cart | Session |
| `GET` | `/cart/view` | View cart | Session |
| `POST` | `/order/place` | Place order `{total}` — clears cart | Session |
| `GET` | `/order/my` | Get order history | Session |
| `GET` | `/admin/all-approvals` | All restaurant approval records | Admin |
| `GET` | `/admin/all-users` | All non-admin users | Admin |
| `GET` | `/admin/all-restaurants` | All restaurants | Admin |
| `POST` | `/admin/approve-restaurant/{id}` | Approve → APPROVED | Admin |
| `POST` | `/admin/reject-restaurant/{id}` | Reject `{reason}` | Admin |
| `POST` | `/admin/block-restaurant/{id}` | Block → foods unavailable | Admin |
| `POST` | `/admin/unblock-restaurant/{id}` | Unblock restaurant | Admin |
| `POST` | `/admin/block-user/{id}` | Block user → login denied | Admin |
| `POST` | `/admin/unblock-user/{id}` | Unblock user | Admin |
| `POST` | `/payment/create-order` | Create Razorpay order `{amount}` | Session |
| `POST` | `/payment/verify` | Verify HMAC + place order | Session |

---

##  Important Backend Fixes

If the admin panel shows users/restaurants as empty, verify these are done:

**1. `CorsConfig.java`** — must use `/**` not `/auth/**`:
```java
source.registerCorsConfiguration("/**", config);
```

**2. `AuthController.java`** — must have `/me` endpoint:
```java
@GetMapping("/me")
public ResponseEntity<?> getCurrentUser(HttpSession session) {
    User u = (User) session.getAttribute("user");
    if (u == null) return ResponseEntity.status(401).body("Not logged in");
    return ResponseEntity.ok(repo.findByEmail(u.getEmail()));
}
```

**3. `User.java`** — `isBlocked` field naming:
```java
private boolean isBlocked = false;
public boolean isBlocked() { return isBlocked; }
public void setBlocked(boolean blocked) { isBlocked = blocked; }
```

**4. `Restaurant.java`** — status field with column annotation:
```java
@Column(name = "status")
private String status = "PENDING";
```

---

##  Test Razorpay Payment

Use these test credentials in the Razorpay payment modal:

| Field | Value |
|---|---|
| Card Number | `4111 1111 1111 1111` |
| Expiry | Any future date (e.g. `12/26`) |
| CVV | Any 3 digits (e.g. `123`) |
| OTP | `1234` |

---

##  Future Enhancements

- [ ] BCrypt password hashing via Spring Security
- [ ] JWT authentication (stateless, mobile-ready)
- [ ] Live Razorpay production keys + webhook handling
- [ ] AWS S3 / Cloudinary for cloud image storage
- [ ] Real-time order updates via WebSockets (STOMP)
- [ ] Email notifications via Spring Mail (SMTP already configured)
- [ ] Server-side food search with category and price filters
- [ ] Ratings & reviews system
- [ ] Order cancellation with auto-refund
- [ ] Docker + docker-compose setup
- [ ] React Native mobile app (iOS + Android)

---

##  Authors

| Name | LinkedIn |
|---|---|
| **Debayan Sarkar** | [linkedin.com/in/d3bayansarkar](https://www.linkedin.com/in/d3bayansarkar/) |
| **Anuja Ghosal** | [linkedin.com/in/anuja-ghosal](https://www.linkedin.com/in/anuja-ghosal/) |

---
