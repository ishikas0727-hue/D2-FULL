// Server-side validation for posts (never trust the frontend).
const POST_TYPES = ["question", "article"];
const POST_PLANS = ["free", "paid"];

const LIMITS = {
  title: { min: 5, max: 120 },
  abstract: { min: 10, max: 500 },
  body: { min: 20, max: 10000 },
  tagsMax: 3,
  tagMax: 20,
};

const TAG_REGEX = /^[A-Za-z0-9][A-Za-z0-9 +#.\-_]*$/;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Returns { errors: string[], value: object|null }
function validatePost(body = {}) {
  const errors = [];

  const postType = clean(body.postType).toLowerCase();
  const postPlan = clean(body.postPlan).toLowerCase();
  const title = clean(body.title);
  const abstract = clean(body.abstract);
  const text = clean(body.text);

  if (!POST_TYPES.includes(postType)) errors.push("Post type must be Question or Article.");
  if (!POST_PLANS.includes(postPlan)) errors.push("Post plan must be Free or Paid.");

  if (title.length < LIMITS.title.min || title.length > LIMITS.title.max) {
    errors.push(`Title must be ${LIMITS.title.min}-${LIMITS.title.max} characters.`);
  }

  if (postType === "article") {
    if (abstract.length < LIMITS.abstract.min || abstract.length > LIMITS.abstract.max) {
      errors.push(`Abstract must be ${LIMITS.abstract.min}-${LIMITS.abstract.max} characters.`);
    }
    if (text.length < LIMITS.body.min || text.length > LIMITS.body.max) {
      errors.push(`Article text must be ${LIMITS.body.min}-${LIMITS.body.max} characters.`);
    }
  } else if (postType === "question") {
    if (text.length < LIMITS.body.min || text.length > LIMITS.body.max) {
      errors.push(`Question description must be ${LIMITS.body.min}-${LIMITS.body.max} characters.`);
    }
  }

  let tags = Array.isArray(body.tags) ? body.tags.map(clean).filter(Boolean) : [];
  tags = [...new Set(tags.map((t) => t.toLowerCase()))];
  if (tags.length < 1 || tags.length > LIMITS.tagsMax) {
    errors.push(`Please add between 1 and ${LIMITS.tagsMax} tags.`);
  } else if (tags.some((t) => t.length > LIMITS.tagMax || !TAG_REGEX.test(t))) {
    errors.push(`Each tag must be at most ${LIMITS.tagMax} characters (letters, numbers, + # . - _).`);
  }

  if (errors.length) return { errors, value: null };

  return {
    errors,
    value: {
      postType,
      postPlan,
      title,
      abstract: postType === "article" ? abstract : "",
      text,
      tags,
    },
  };
}

module.exports = { validatePost, LIMITS };
