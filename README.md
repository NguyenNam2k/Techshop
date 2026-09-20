# TechGear-Gaming-Store
A specialized, full-featured e-commerce platform for computer hardware, PC components, and high-performance gaming peripherals. Built with React, Node.js (Express), Python (FastAPI), and MySQL, featuring a cutting-edge Multimodal AI Search Engine (Reverse Image & Semantic Search), real-time hardware configuration, and transactional order management.
## 🚀 Project Overview
TechGear is a modern e-commerce solution engineered specifically for tech enthusiasts, gamers, and custom PC builders. The platform bridges the gap between visual inspiration and technical specifications by allowing users to search for complex hardware components using real-world setup photos, natural language intent, or hybrid combinations, alongside deep hardware configuration, atomic inventory locking, and instant VietQR banking payments.
## ✨ Key Features

### 🏠 Homepage
- **Hero Showcase** - Interactive presentation of flagship PC builds and performance gear
- **Bento Category Grid** - High-contrast visual navigation for GPUs, Keyboards, Coolers, and Cases
- **Trending Hardware** - Curated carousel featuring real-time specs chips (RTX 4070, 144Hz, Hot-swap)
- **SEO Optimized** - Structured metadata and clean semantic open-graph tags

### 🛍️ E-commerce Core
- **Product Catalog** - Comprehensive hardware browsing with multi-category navigation
- **Advanced Technical Filtering** - Filter by brand, price range, form factor, switch type, and connectivity
- **Instant Search** - Debounced real-time text query suggestions
- **Hardware Details (PDP)** - In-depth product showcases with interactive multi-angle galleries
- **Shopping Cart** - Persistent cart state with dynamic subtotal recalculation
- **Hardware Wishlist** - Save desired components for future builds

### 🧠 Multimodal AI Search Engine
- **Reverse Image Search** - Upload desk setup or component photos to locate matching hardware
- **Semantic Natural Search** - Conversational search understanding natural intent (e.g., *"silent mechanical keyboard for office work"*)
- **Hybrid Multimodal Fusion** - Combine an uploaded image with spec modifiers using weighted vector math ($0.6 \times \text{Image} + 0.4 \times \text{Text}$)
- **Image Cropping Tool** - Built-in canvas cropper to isolate specific peripherals or components from full setup photos
- **Visual Confidence Badges** - Real-time match scoring display on search result cards (e.g., *"94% AI Match"*)
- **Skeleton Shimmer Loading** - Smooth UI feedback during vector embedding extraction

### ⚙️ Hardware Configurator & PDP
- **Multi-Angle Gallery** - High-resolution viewport for close-up port inspects, PCB traces, and backplates
- **Dynamic Variant Matrix** - Select colorways and technical versions (Switch type, RAM/SSD capacities)
- **Live Stock Indicator** - Real-time inventory status badges (e.g., *"In Stock: 8 units left"*)
- **Interactive Price Sync** - Instant price adjustment based on selected hardware configuration
- **Technical Specifications Table** - Structured two-column key-value specification breakdown

### 👤 User Management & Security
- **User Registration** - Account creation with automated welcome flows
- **JWT Authentication** - Secure token-based authentication with Bcrypt password encryption
- **Google OAuth 2.0** - One-click social sign-in integration
- **Inactivity Auto-Logout** - Client-side idle event listeners coupled with server-side session cleanup workers
- **Order History** - Complete purchase tracking and invoice lookup

### 🛒 Checkout & VietQR Banking
- **Transactional Inventory Lock** - Atomic database updates during checkout to eliminate race conditions and over-selling
- **Dynamic VietQR Integration** - Automated QR code generation pre-filled with exact amount, bank account, and order memo
- **Cash on Delivery (COD)** - Traditional doorstep payment option
- **Real-Time Order Tracking** - Visual status pipeline (Pending, Processing, Shipped, Delivered, Cancelled)

### 📊 Store Admin Dashboard
- **KPI Metric Overview** - Real-time statistics for revenue, total orders, and active catalog counts
- **Hardware Inventory Table** - Multi-variant stock tracking with instant edit and deletion controls
- **Multi-Angle Asset Upload** - Direct image upload pipeline integrated with Cloudinary CDN
- **Auto-Vector Sync Trigger** - Automated event hook triggering Python FastAPI to vectorize new hardware upon creation
- **Order Lifecycle Management** - Status updates with automated stock replenishment on cancellation
- **Low-Stock Warnings** - Proactive threshold alerts for components with stock $\le 5$ units

### 📱 Responsive & Cyber Dark Theme
- **Cyberpunk Dark Aesthetic** - Deep slate backgrounds with electric cyber cyan and neon violet accents
- **Mobile-First Responsiveness** - Touch-optimized navigation and configurators across all screen sizes
- **Accessible Typography** - Crisp pairing of Plus Jakarta Sans with JetBrains Mono for specs


## 🛠️ Technologies Used
### Core Frameworks & Runtime
- **React 18** - Component-based client UI library
- **Vite 5** - Next-generation frontend build tooling
- **Node.js 18+** - Asynchronous event-driven JavaScript runtime
- **Express.js 4.19** - Fast, unopinionated backend web framework
- **Python 3.10+** - High-performance runtime for AI microservices
- **FastAPI 0.100+** - Modern, asynchronous Python web API framework
### AI & Computer Vision
- **PyTorch** - Deep learning tensor computation framework
- **Hugging Face Transformers** - Pretrained state-of-the-art vision-language models
- **clip-ViT-B-32-multilingual-v1** - Multimodal vector backbone supporting text and visual embeddings
- **Cosine Similarity Engine** - Vector distance calculation for similarity retrieval
### Database & Asset Management
- **MySQL 8.0 / 9.x** - Relational database with InnoDB engine and native JSON data types
- **mysql2/promise** - High-performance MySQL client with connection pooling
- **Cloudinary SDK** - Cloud asset management for multi-angle hardware photography
### Styling & UI Components
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Lucide React** - Clean and consistent icon library
- **react-easy-crop** - Canvas-based image cropper for visual search queries
- **Axios** - Promise-based HTTP client
### Authentication & Utilities
- **JSON Web Token (jsonwebtoken)** - Stateless token-based authorization
- **Bcryptjs** - Salted password hashing
- **Google Auth Library** - Google OAuth 2.0 credential verification
- **node-cron** - Task scheduling for inactive session cleanup workers
- **dotenv** - Environment variable management
### Development & Testing Tools
- **Thunder Client / Postman** - API endpoint testing and automation
- **ESLint & Prettier** - Code quality and formatting enforcement
- **Uvicorn** - Lightning-fast ASGI web server for Python
## 📁 Project Structure

<details open>
  <summary>📁 <b>techgear/</b> <i>(Root Monorepo)</i></summary>
  <ul>
    <li>
      <details open>
        <summary>📁 <b>frontend/</b> — <i>Client-side React 18 SPA (Vite + Tailwind CSS)</i></summary>
        <ul>
          <li>📁 <b>public/</b> — <i>Static assets, brand logos, payment badges, favicon</i></li>
          <li>
            <details open>
              <summary>📁 <b>src/</b> — <i>Core application source code</i></summary>
              <ul>
                <li>📁 <b>assets/</b> — <i>Shared stylesheets and static icons</i></li>
                <li>📁 <b>components/</b> — <i>Modular UI components (AI modal, PDP variant matrix, VietQR card)</i></li>
                <li>📁 <b>pages/</b> — <i>Route views (Home, Catalog, ProductDetail, Cart, Checkout, Admin)</i></li>
                <li>📁 <b>services/</b> — <i>Centralized Axios HTTP service clients</i></li>
                <li>📄 <code>App.jsx</code> — <i>Root router configuration and layout wrapper</i></li>
                <li>📄 <code>main.jsx</code> — <i>React DOM application entry point</i></li>
              </ul>
            </details>
          </li>
          <li>📄 <code>package.json</code> — <i>Frontend dependencies and scripts</i></li>
          <li>📄 <code>tailwind.config.js</code> — <i>Cyber Dark theme color palette config</i></li>
          <li>📄 <code>vite.config.js</code> — <i>Vite development and build configuration</i></li>
        </ul>
      </details>
    </li>
    <li>
      <details open>
        <summary>📁 <b>backend/</b> — <i>Core Web Server (Node.js & Express.js)</i></summary>
        <ul>
          <li>📁 <b>database/</b> — <i>MySQL schema DDL and realistic tech hardware seed datasets</i></li>
          <li>
            <details open>
              <summary>📁 <b>src/</b> — <i>Server source code</i></summary>
              <ul>
                <li>📁 <b>config/</b> — <i>MySQL InnoDB connection pool and Cloudinary CDN setup</i></li>
                <li>📁 <b>controllers/</b> — <i>Transactional checkout, inventory lock, PDP retrieval</i></li>
                <li>📁 <b>middlewares/</b> — <i>JWT authorization guards and Multer file parsers</i></li>
                <li>📁 <b>routes/</b> — <i>REST endpoint definitions (admin, auth, orders, products)</i></li>
                <li>📁 <b>workers/</b> — <i>Inactivity session revocation background cron jobs</i></li>
                <li>📄 <code>server.js</code> — <i>Express application runtime entrypoint</i></li>
              </ul>
            </details>
          </li>
          <li>📄 <code>package.json</code> — <i>Backend dependencies and server scripts</i></li>
          <li>📄 <code>.env.example</code> — <i>Template for database and JWT credentials</i></li>
        </ul>
      </details>
    </li>
    <li>
      <details open>
        <summary>📁 <b>ai-service/</b> — <i>AI Microservice (Python FastAPI & Multilingual CLIP)</i></summary>
        <ul>
          <li>📄 <code>main.py</code> — <i>FastAPI application and visual/text search endpoints</i></li>
          <li>📄 <code>model.py</code> — <i>clip-ViT-B-32-multilingual-v1 loader and tensor encoding</i></li>
          <li>📄 <code>similarity.py</code> — <i>Cosine similarity and weighted hybrid vector fusion</i></li>
          <li>📄 <code>requirements.txt</code> — <i>Python libraries (fastapi, uvicorn, torch, transformers)</i></li>
          <li>📄 <code>.env.example</code> — <i>Environment configuration for AI model and port</i></li>
        </ul>
      </details>
    </li>
    <li>📄 <code>.gitignore</code> — <i>Multi-stack git ignore rules (Node.js & Python)</i></li>
    <li>📄 <code>LICENSE</code> — <i>MIT open-source license</i></li>
    <li>📄 <code>README.md</code> — <i>Project documentation and architecture overview</i></li>
  </ul>
</details>

🚀 Getting Started
Prerequisites
Node.js v18.0.0 or higher
npm or yarn
Python 3.10 or higher
MySQL Server 8.0 or 9.x

🚀 Deployment
Production Strategy
Frontend: Build static bundle (npm run build) and serve via Nginx or Vercel
Backend: Containerize with Node.js LTS Alpine image and run with PM2 cluster mode
AI Service: Deploy via Docker using Gunicorn with Uvicorn workers
Database: Managed MySQL instance with automated snapshot backups

📄 License
This project is open-source and available under the MIT License.

📞 Support
For questions, bug reports, or feature requests, please open an issue in the repository.
