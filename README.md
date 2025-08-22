# Cafe Frontend

A **React-based frontend** for the Cafe system. This application communicates with the [Cafe API Backend](https://github.com/yourname/cafe_api) to provide users with a smooth experience for browsing meals, managing carts, handling authentication, and placing orders.

---

## 📌 Project Structure

```
cafe_frontend/
├── cafe-frontend/
│   ├── src/
│   │   ├── components/    
│   │   ├── config/         
│   │   ├── contexts/ 
│   │   ├── hooks/          
│   │   ├── pages/          
│   │   ├── services/       
│   │   ├── types/          
│   │   ├── App.tsx          
│   │   ├── index.css.      
│   │   ├── main.tsx.       
│   │   └── vite-env.d.ts 
│   ├── .dockerignore
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint-config.js
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

* **React**
* **Vite**
* **Tailwind CSS**
* **Axios / Fetch API**
* **React Router**

---

## 🚀 How to Run the App

### 🐳 Using Docker

1. **Clone the repository**

   ```bash
   git clone https://github.com/AmalSultanov/cafe_frontend.git
   cd cafe_frontend
   ```

2. **Create a `.env` file and set environment variables in any editor**

   ```bash
   cp cafe-frontend/.env.example cafe-frontend/.env
   nano cafe-frontend/.env
   ```

   ```
   VITE_HOST=localhost
   VITE_PORT=5173
   VITE_API_BASE_URL=your_backend_url
   VITE_ACCESS_TOKEN_LIFETIME=15
   VITE_TOKEN_REFRESH_BEFORE_EXPIRY=1 (number of minutes before token expiry)
   VITE_NODE_ENV=development
   VITE_DEBUG_MODE=true
   ```

3. **Build and run using Docker**

   ```bash
   docker build -t cafe-frontend .
   docker run -p 80:80 cafe-frontend
   ```

The app will be available at **[http://localhost](http://localhost)**

---