// Firebase Admin SDK setup (D2). Used ONLY on the backend.
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

function loadCredential() {
  const keyPath = path.resolve(
    __dirname,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json"
  );
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Firebase service account key not found at ${keyPath}. ` +
        "Download it from Firebase Console > Project settings > Service accounts " +
        "and set FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env"
    );
  }
  return admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8")));
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: loadCredential() });
}

module.exports = { admin, db: admin.firestore(), auth: admin.auth() };
