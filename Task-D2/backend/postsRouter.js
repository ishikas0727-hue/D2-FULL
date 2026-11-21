// D2 posts API. All Firestore access for posts happens here, never in the frontend.
const express = require("express");
const { admin, db, auth } = require("./firebaseAdmin");
const { validatePost } = require("./validation");

const router = express.Router();

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

// Verifies the Firebase ID token. Sets req.user = { uid, email } or leaves it undefined.
async function readUser(req) {
  const token = bearerToken(req);
  if (!token) return { status: "anonymous" };
  try {
    const decoded = await auth.verifyIdToken(token);
    return { status: "ok", user: { uid: decoded.uid, email: decoded.email || "" } };
  } catch {
    return { status: "invalid" };
  }
}

// The plan is ALWAYS read from Firestore on the server, never taken from the client.
async function getPlan(uid) {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists && snap.data().plan === "paid" ? "paid" : "free";
}

// POST /api/posts - login required
router.post("/", async (req, res) => {
  const result = await readUser(req);
  if (result.status !== "ok") {
    return res.status(401).json({ message: "You must be logged in to submit a post." });
  }

  const { errors, value } = validatePost(req.body);
  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  try {
    const ref = await db.collection("posts").add({
      ...value,
      authorId: result.user.uid,
      authorEmail: result.user.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ message: "Post created successfully.", id: ref.id });
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ message: "Could not save the post. Please try again." });
  }
});

// GET /api/posts - visitors/free users get free posts only, paid users get all
router.get("/", async (req, res) => {
  const result = await readUser(req);
  if (result.status === "invalid") {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }

  try {
    const plan = result.status === "ok" ? await getPlan(result.user.uid) : "visitor";

    // Paid-only posts are filtered in the database query, so they never leave the server
    // for visitors or free users.
    let query = db.collection("posts");
    if (plan !== "paid") query = query.where("postPlan", "==", "free");
    const snap = await query.get();

    const posts = snap.docs
      .map((d) => {
        const data = d.data();
        const created = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : null;
        return {
          id: d.id,
          postType: data.postType,
          postPlan: data.postPlan,
          title: data.title,
          abstract: data.abstract || "",
          text: data.text || data.description || "",
          tags: data.tags || [],
          authorId: data.authorId,
          authorEmail: data.authorEmail || "",
          createdAt: created ? created.toISOString() : null,
        };
      })
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return res.json({ plan, posts });
  } catch (err) {
    console.error("Fetch posts error:", err);
    return res.status(500).json({ message: "Could not load posts. Please try again." });
  }
});

module.exports = router;
