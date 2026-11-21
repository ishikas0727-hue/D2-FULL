# Task D1 Setup

## Frontend
cd frontend
npm install
npm run dev

## Backend (P5 newsletter)
cd backend
npm install
npm start

## Firebase
The frontend already contains the Firebase configuration from the supplied project. Enable Email/Password authentication in Firebase Authentication.

Deploy the included `firestore.rules` to the same Firebase project, or copy its rules into Firebase Console > Firestore Database > Rules and publish.

D1 flow: Register -> users/{uid} with plan=free -> Login -> Pricing -> Upgrade Plan -> demo payment validation -> users/{uid}.plan=paid.

No full card number/CVV is stored.

## D1 Navigation
The top navigation uses a minimal DEV@Deakin layout with a logo, search field, Post, Pricing and Login/Logout controls. Existing page content and the P5 backend are preserved.
