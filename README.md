<div align="center">

<img src="Frontend/public/logo_nomzee.png" alt="NOMZEE Logo" width="100" height="100" style="border-radius: 20px;" />

# NOMZEE


**A full-stack online food delivery platform built with Spring Boot & React.js**

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apache-maven&logoColor=white)](https://maven.apache.org/)

---

</div>

## 📖 About

**NOMZEE** is a feature-rich food delivery web application where customers can discover restaurants, browse menus, manage their cart, and place orders — while restaurant owners get a full business dashboard to manage their menu, track listings, and control item availability in real time.

Built as a full-stack project, NOMZEE follows a clean three-tier architecture:

- 🎨 **Presentation Layer** — React.js (Vite) with dark-themed UI
- ⚙️ **Business Logic Layer** — Spring Boot REST API
- 🗄️ **Data Layer** — MySQL via Spring Data JPA / Hibernate

---

## ✨ Features

### 👤 For Customers
- Register and log in as a **CUSTOMER**
- Browse the full menu with live **search**
- **Add to cart** with quantity controls (+/- per item)
- View order summary
- **Place orders** with the correct grand total stored in the database
- Track orders with an **animated 4-step progress tracker**
- View full **order history** with item breakdown

### 🏪 For Restaurant Owners (BUSINESS)
- Register and log in as a **BUSINESS** user
- Add and manage your restaurants
- Add food items with **drag & drop image upload** (auto-cropped to 1:1)
- **Edit** food name, price, description, and image inline
- **Delete** food items with confirmation modal
- **Toggle availability** — mark items as unavailable (greyed out for customers)
- Dashboard shows only **your own restaurant's items** (strict owner filtering)

### 🔐 Auth & Security
- Session-based authentication via **HTTP sessions (JSESSIONID)**
- Role-based route protection (**CUSTOMER** vs **BUSINESS**)
- CORS configured to allow frontend (`:5173`) ↔ backend (`:8080`)
- Email-to-role mapping persisted in `localStorage` across sessions

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, Vite 5, React Router DOM v6 |
| Styling | CSS Variables, Google Fonts (Syne + DM Sans) |
| HTTP Client | Axios (global `withCredentials: true`) |
| Backend | Spring Boot 3.x, Java 17 |
| ORM | Spring Data JPA, Hibernate |
| Database | MySQL 8.0 |
| Build Tool | Maven |
| API Testing | Postman |

---

## 📁 Project Structure

```
nomzee/
│
├── food-backend/                        # Spring Boot backend
│   └── src/main/java/com/example/foodapp/
│       ├── config/
│       │   └── CorsConfig.java          # CORS setup
│       ├── controller/
│       │   ├── AuthController.java      # POST /auth/register, /auth/login
│       │   ├── FoodController.java      # CRUD /food/*
│       │   ├── RestaurantController.java # /restaurant/*
│       │   ├── CartController.java      # /cart/*
│       │   └── OrderController.java     # POST /order/place
│       ├── entity/
│       │   ├── User.java
│       │   ├── Restaurant.java
│       │   ├── FoodItem.java
│       │   ├── CartItem.java
│       │   └── Order.java
│       ├── repository/                  # Spring Data JPA interfaces
│       ├── service/                     # Service interfaces
│       └── service/serviceimpl/         # Business logic implementations
│
└── rest-api-frontend/                   # React.js frontend
    ├── public/
    │   └── logo_nomzee.png              # Favicon & navbar logo
    └── src/
        ├── components/
        │   ├── Navbar.jsx               # Role-aware navigation
        │   ├── Welcome.jsx              # Landing page / hero
        │   ├── AuthPage.jsx             # Login & Register
        │   ├── MenuPage.jsx             # Food grid with cart controls
        │   ├── CartPage.jsx             # Cart + order summary
        │   ├── OrdersPage.jsx           # Order history + tracker
        │   ├── DashboardPage.jsx        # Business owner dashboard
        │   └── Footer.jsx
        ├── App.jsx                      # Root component + routing
        ├── App.css                      # Auth + global component styles
        └── index.css                    # CSS variables + base styles
```

---

## 🚀 Getting Started

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

Open MySQL and run:

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
```

> ⚠️ Keep `ddl-auto=update` — never use `create` or `create-drop` in production as it wipes your data on every restart.

---

### 4. Start the Backend

```bash
cd food-backend
mvn spring-boot:run
```

The backend will start at **http://localhost:8080**

Tables are auto-created by Hibernate on first run.

---

### 5. Start the Frontend

```bash
cd rest-api-frontend
npm install
npm run dev
```

The frontend will start at **http://localhost:5173**

> The Vite proxy automatically forwards all API calls (`/auth`, `/food`, `/cart`, `/order`, `/restaurant`) to `http://localhost:8080` — no manual URL configuration needed.

---

## 📡 API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | None |
| `POST` | `/auth/login` | Login — creates session | None |
| `GET` | `/food/all` | Get all food items | None |
| `POST` | `/food/add` | Add new food item | Session |
| `PUT` | `/food/update/{id}` | Edit food item | Session |
| `DELETE` | `/food/delete/{id}` | Delete food item | Session |
| `POST` | `/restaurant/add` | Register restaurant | Session |
| `GET` | `/restaurant/all` | Get all restaurants | None |
| `GET` | `/restaurant/my` | Get owner's restaurants only | Session |
| `POST` | `/cart/add` | Add item to cart `{foodId, qty}` | Session |
| `GET` | `/cart/view` | View cart items | Session |
| `POST` | `/order/place` | Place order `{total}` | Session |

---

## 🗄️ Database Schema

```
user         → id, name, email, password, role
restaurant   → id, name, address, owner_id (FK→user)
food_item    → id, name, description, price, imageUrl, restaurant_id (FK→restaurant)
cart_item    → id, quantity, food_id (FK→food_item), user_id (FK→user)
orders       → id, total, createdAt, user_id (FK→user)
```

---

## 🧪 Test the API with Postman

**1. Register as Customer**
```json
POST /auth/register
{
  "name": "customer",
  "email": "customer@gmail.com",
  "password": "1234",
  "role": "CUSTOMER",
  "phone": "9876543210",
  "address": "Kolkata"
}
```

**2. Register as Business**
```json
POST /auth/register
{
  "name": "RestaurantOwner",
  "email": "owner@gmail.com",
  "password": "1234",
  "role": "BUSINESS"
}
```

**3. Login**
```json
POST /auth/login
{ "email": "owner@gmail.com", "password": "1234" }
```
> Postman automatically saves the `JSESSIONID` cookie. All subsequent requests use it.

**4. Add Restaurant**
```json
POST /restaurant/add
{ "name": "Food Paradise", "address": "Kolkata" }
```

**5. Add Food Item**
```json
POST /food/add
{
  "name": "Pizza",
  "description": "Cheesy pizza",
  "price": 250,
  "imageUrl": "img",
  "restaurant": { "id": 1 }
}
```

**6. Add to Cart (as Customer)**
```json
POST /cart/add
{ "foodId": 1, "qty": 2 }
```

**7. Place Order**
```json
POST /order/place
{ "total": 952 }
```

---

## 📸 Screenshots

| Home Page | Menu | Cart | Dashboard |
|---|---|---|---|
| ![Home]() | ![Menu]() | ![Cart]() | ![Dashboard]() |

---

## 🔮 Future Enhancements

- [ ] JWT Authentication (stateless, mobile-ready)
- [ ] BCrypt password hashing via Spring Security
- [ ] Razorpay / Stripe payment gateway integration
- [ ] AWS S3 / Cloudinary for cloud image storage
- [ ] Real-time order tracking via WebSockets
- [ ] Admin panel for platform-wide management
- [ ] Server-side food search and category filters
- [ ] Ratings & reviews system
- [ ] React Native mobile app

---

## 👨‍💻 Authors

| Name | LinkedIn |
|---|---|
| **Debayan Sarkar** | [linkedin.com/in/d3bayansarkar](https://www.linkedin.com/in/d3bayansarkar/) |
| **Anuja Ghosal** | [linkedin.com/in/anuja-ghosal-10b10b2b2](https://www.linkedin.com/in/anuja-ghosal-10b10b2b2/) |

---


<div align="center">

</div>
