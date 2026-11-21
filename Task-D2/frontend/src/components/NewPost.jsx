import React, { useState } from "react";
import { apiFetch } from "../api";
import { useD1Auth } from "../context/D1AuthContext";

const LIMITS = { title: [5, 120], abstract: [10, 500], body: [20, 10000], tags: 3, tag: 20 };
const TAG_REGEX = /^[A-Za-z0-9][A-Za-z0-9 +#.\-_]*$/;

function validate({ postType, title, abstract, text, tags }) {
  if (title.length < LIMITS.title[0] || title.length > LIMITS.title[1])
    return `Title must be ${LIMITS.title[0]}-${LIMITS.title[1]} characters.`;
  if (postType === "article" && (abstract.length < LIMITS.abstract[0] || abstract.length > LIMITS.abstract[1]))
    return `Abstract must be ${LIMITS.abstract[0]}-${LIMITS.abstract[1]} characters.`;
  if (text.length < LIMITS.body[0] || text.length > LIMITS.body[1])
    return `${postType === "article" ? "Article text" : "Question description"} must be ${LIMITS.body[0]}-${LIMITS.body[1]} characters.`;
  if (tags.length < 1 || tags.length > LIMITS.tags) return "Please add between 1 and 3 tags.";
  if (tags.some((t) => t.length > LIMITS.tag || !TAG_REGEX.test(t)))
    return `Each tag must be at most ${LIMITS.tag} characters (letters, numbers, + # . - _).`;
  return "";
}

function NewPost({ goTo }) {
  const { user } = useD1Auth();
  const [postType, setPostType] = useState("question");
  const [postPlan, setPostPlan] = useState("free");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const notify = (type, msg) => {
    setMessage({ type, text: msg });
    window.alert(msg); // alert the user of the outcome
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!user) return notify("error", "Please log in before creating a post.");

    const tagList = [...new Set(tags.split(",").map((t) => t.trim()).filter(Boolean))];
    const payload = {
      postType,
      postPlan,
      title: title.trim(),
      abstract: abstract.trim(),
      text: text.trim(),
      tags: tagList,
    };

    const problem = validate(payload);
    if (problem) return notify("error", problem);

    setSaving(true);
    try {
      // Storing is handled by the Express backend (not directly from the frontend).
      await apiFetch("/api/posts", { method: "POST", body: JSON.stringify(payload) });
      notify("success", "Post created successfully!");
      setTitle("");
      setAbstract("");
      setText("");
      setTags("");
    } catch (err) {
      notify("error", err.message || "Could not save the post.");
    } finally {
      setSaving(false);
    }
  };

  const isArticle = postType === "article";

  return (
    <main className="new-post-page">
      <section className="new-post-section">
        <h1>New Post</h1>
        <p>Share your question or article with the DEV@Deakin community.</p>

        <form className="new-post-card" onSubmit={handleSubmit} noValidate>
          <div className="post-type-section">
            <label className="section-label">Select Post Type</label>
            <div className="post-type-options">
              <label>
                <input type="radio" name="postType" checked={postType === "question"} onChange={() => setPostType("question")} /> Question
              </label>
              <label>
                <input type="radio" name="postType" checked={isArticle} onChange={() => setPostType("article")} /> Article
              </label>
            </div>
          </div>

          <div className="post-type-section">
            <label className="section-label">Select Post Plan</label>
            <div className="post-type-options">
              <label>
                <input type="radio" name="postPlan" checked={postPlan === "free"} onChange={() => setPostPlan("free")} /> Free
              </label>
              <label>
                <input type="radio" name="postPlan" checked={postPlan === "paid"} onChange={() => setPostPlan("paid")} /> Paid
              </label>
            </div>
          </div>

          <div className="post-info-box">
            <h2>What do you want to {isArticle ? "share" : "ask"}?</h2>
            <p>
              {isArticle
                ? "Write an article with a short abstract and the full article text."
                : "Describe your problem clearly so the community can help."}
            </p>
          </div>

          <div className="post-field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a descriptive title" maxLength={LIMITS.title[1]} />
          </div>

          {isArticle && (
            <div className="post-field">
              <label>Abstract</label>
              <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows="3" placeholder="Enter a 1-paragraph abstract" maxLength={LIMITS.abstract[1]} />
            </div>
          )}

          <div className="post-field">
            <label>{isArticle ? "Article Text" : "Describe your problem"}</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows="6" placeholder={isArticle ? "Enter your article" : "Describe your question"} maxLength={LIMITS.body[1]} />
          </div>

          <div className="post-field">
            <label>Tags</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Please add up to 3 tags e.g., Java, React, Firebase" />
            <small>Use up to 3 comma-separated tags.</small>
          </div>

          {message.text && <p className={`post-message ${message.type}`}>{message.text}</p>}

          <div className="post-actions">
            <button type="submit" className="post-button" disabled={saving}>{saving ? "Posting..." : "Post"}</button>
            <button type="button" className="back-link" onClick={() => goTo("home")}>Back</button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default NewPost;
