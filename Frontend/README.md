# Nomzee Frontend

A modern food delivery app frontend built with React (Vite), connecting to the Spring Boot backend.

## Tech Stack
- **React 18** + **Vite**
- **React Router DOM v6** for routing
- **Axios** for API calls
- **CSS Variables** for theming (dark mode, orange primary)
- **Google Fonts**: Syne (headings) + DM Sans (body)

## Project Structure
```
src/
├── components/
│   ├── navbar.jsx / navbar.css       → Fixed top nav with user dropdown
│   ├── Welcome.jsx / Welcome.css     → Hero landing page
│   ├── Header.jsx / Header.css       → Reusable page header
│   ├── Footer.jsx / Footer.css       → Site footer
│   ├── MenuPage.jsx / MenuPage.css   → Food listing with filters
│   ├── CartPage.jsx / CartPage.css   → Cart + order summary
│   ├── OrdersPage.jsx / OrdersPage.css → Order history + tracker
│   ├── AuthPage.jsx                  → Login & Register
│   └── AdminPage.jsx / AdminPage.css → Admin panel (add food/restaurant)
├── App.jsx     → Main router + global state
├── App.css     → Auth styles + modals + utilities
├── index.css   → Global CSS variables + base styles
└── main.jsx    → Entry point
```

## Routes
| Path | Component | Auth Required |
|------|-----------|--------------|
| `/` | Welcome | No |
| `/menu` | MenuPage | No |
| `/cart` | CartPage | Yes |
| `/orders` | OrdersPage | Yes |
| `/login` | AuthPage | No |
| `/register` | AuthPage | No |
| `/admin` | AdminPage | ADMIN role |

## Backend API Endpoints Used
- `POST /auth/register` — Register user
- `POST /auth/login` — Login (session-based)
- `GET /food/all` — Get all food items
- `POST /food/add` — Add food (admin)
- `POST /cart/add` — Add item to cart
- `GET /cart` — Get cart items
- `POST /order/place` — Place order

## Setup

```bash
npm install
npm run dev
```

Make sure your Spring Boot backend is running on `http://localhost:8080`.
The Vite dev server proxies `/auth`, `/food`, `/cart`, `/order` to the backend.

## Features
- 🌑 Dark theme with orange accent
- 🍔 Food grid with filters & search
- 🛒 Cart with order summary & promo code
- 📦 Order history with delivery tracker
- 👤 User auth with role-based access (USER / ADMIN)
- 🔔 Toast notifications
- 📱 Fully responsive
