import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useD1Auth } from "../context/D1AuthContext";

const EMPTY_FILTERS = { type: "all", plan: "all", tag: "", from: "", to: "" };

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleString() : "Just now";
}

function BrowsePosts({ goTo }) {
  const { user, plan, loading: authLoading } = useD1Auth();
  const [posts, setPosts] = useState([]); // original order from the backend
  const [order, setOrder] = useState([]); // current (draggable) order of ids
  const [hidden, setHidden] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState(null);

  // Ask the backend for the posts this user is allowed to see.
  // Re-runs on login, logout and plan upgrade.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setStatus("loading");
    setError("");

    apiFetch("/api/posts")
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts);
        setOrder(data.posts.map((p) => p.id));
        setHidden([]);
        setExpanded([]);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.uid, plan]);

  const visible = useMemo(() => {
    const byId = new Map(posts.map((p) => [p.id, p]));
    const tag = filters.tag.trim().toLowerCase();
    const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
    const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null;

    return order
      .map((id) => byId.get(id))
      .filter(Boolean)
      .filter((p) => !hidden.includes(p.id))
      .filter((p) => filters.type === "all" || p.postType === filters.type)
      .filter((p) => filters.plan === "all" || p.postPlan === filters.plan)
      .filter((p) => !tag || p.tags.some((t) => t.toLowerCase().includes(tag)))
      .filter((p) => {
        if (!from && !to) return true;
        if (!p.createdAt) return true;
        const d = new Date(p.createdAt);
        return (!from || d >= from) && (!to || d <= to);
      });
  }, [posts, order, hidden, filters]);

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });
  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setHidden([]);
    setExpanded([]);
    setOrder(posts.map((p) => p.id));
  };

  // Optional: drag and drop re-ordering (native HTML5, no extra packages).
  const onDrop = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const next = order.filter((id) => id !== dragId);
    next.splice(next.indexOf(targetId), 0, dragId);
    setOrder(next);
    setDragId(null);
  };

  return (
    <main className="browse-page">
      <section className="browse-section">
        <h1>Browse Posts</h1>
        <p className="browse-sub">
          {user
            ? plan === "paid"
              ? "You are on the Paid plan: showing free and paid posts."
              : "You are on the Free plan: showing free posts only."
            : "You are not logged in: showing free posts only."}
        </p>

        <div className="browse-filters">
          <label>
            Type
            <select value={filters.type} onChange={setFilter("type")}>
              <option value="all">All</option>
              <option value="article">Article</option>
              <option value="question">Question</option>
            </select>
          </label>
          <label>
            Plan
            <select value={filters.plan} onChange={setFilter("plan")}>
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label>
            Tag
            <input value={filters.tag} onChange={setFilter("tag")} placeholder="e.g. react" />
          </label>
          <label>
            From
            <input type="date" value={filters.from} onChange={setFilter("from")} />
          </label>
          <label>
            To
            <input type="date" value={filters.to} onChange={setFilter("to")} />
          </label>
          <button type="button" className="browse-reset" onClick={reset}>Reset</button>
        </div>

        {status === "loading" && <p className="browse-state">Loading posts...</p>}
        {status === "error" && <p className="browse-state browse-error">{error}</p>}
        {status === "ready" && visible.length === 0 && (
          <p className="browse-state">
            {posts.length === 0 ? "No posts available yet." : "No posts match your filters (or all are hidden). Try Reset."}
          </p>
        )}

        {status === "ready" && (
          <ul className="post-list">
            {visible.map((p) => {
              const open = expanded.includes(p.id);
              const body = open ? p.text : p.text.length > 140 ? `${p.text.slice(0, 140)}...` : p.text;
              return (
                <li
                  key={p.id}
                  className={`post-item ${dragId === p.id ? "dragging" : ""}`}
                  draggable
                  onDragStart={() => setDragId(p.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(p.id)}
                  onDragEnd={() => setDragId(null)}
                >
                  <div className="post-item-head">
                    <span className={`badge badge-${p.postType}`}>{p.postType === "article" ? "Article" : "Question"}</span>
                    <span className={`badge badge-${p.postPlan}`}>{p.postPlan === "paid" ? "Paid" : "Free"}</span>
                    <span className="post-date">{formatDate(p.createdAt)}</span>
                  </div>

                  <h3 className="post-title" onClick={() => toggle(expanded, setExpanded, p.id)}>{p.title}</h3>
                  {p.abstract && <p className="post-abstract">{p.abstract}</p>}
                  <p className="post-text" onClick={() => toggle(expanded, setExpanded, p.id)}>{body}</p>

                  <div className="post-tags">
                    {p.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                  </div>

                  <div className="post-item-actions">
                    <span className="post-author">by {p.authorEmail || "unknown"}</span>
                    <button type="button" onClick={() => toggle(expanded, setExpanded, p.id)}>{open ? "Collapse" : "Expand"}</button>
                    <button type="button" onClick={() => toggle(hidden, setHidden, p.id)}>Hide</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button className="back-link" onClick={() => goTo("home")}>← Back to Home</button>
      </section>
    </main>
  );
}

export default BrowsePosts;
