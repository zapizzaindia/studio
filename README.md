# Zapizza - Fast & Delicious Delivery

Zapizza is a multi-tenant food delivery PWA built with Next.js and Firebase.

## 🚀 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Database**: Firebase Firestore (Real-time)
- **Authentication**: Firebase Auth (Mocked for Demo)
- **PWA**: Fully functional Manifest & Service Workers

## 👥 User Roles

### 1. Customer (`/home`)
- **Location Selection**: Browse by City and Outlet.
- **Menu**: Mobile-optimized category browsing.
- **Cart & Checkout**: Local state management with Firestore order placement.
- **Order Tracking**: Real-time status updates.

### 2. Outlet Admin (`/admin`)
- **Dashboard**: Localized sales analytics.
- **Live Orders**: Move orders through the kitchen pipeline.
- **Availability**: Toggle item stock for their specific kitchen.

### 3. Franchise Owner (`/franchise`)
- **Super Admin**: High-level business analytics across all regions.
- **Global Menu**: Manage the master list of products and pricing.
- **User Management**: Assign admins to outlets.

## 🛠 Customization
- **Logo**: Update `src/components/icons.tsx` and place your `logo.png` in the `public/` folder.
- **Theme**: Modify `src/app/globals.css` to change primary colors (Forest Green by default).
- **Mock Data**: Edit `src/lib/mock-data.ts` to change the initial demo environment.
