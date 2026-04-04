import { useEffect, useMemo, useState } from "react";
import RestaurantShell from "../components/RestaurantShell.jsx";
import { api } from "../lib/api.js";
import { downloadCsv } from "../utils/download.js";

function renderStars(rating) {
  return Array.from({ length: 5 }).map((_, index) => (
    <span
      key={`star-${index}`}
      className={`material-symbols-outlined text-sm ${index < rating ? "text-primary filled-star" : "text-slate-300"}`}
    >
      star
    </span>
  ));
}

export default function CustomerReviews({ onNavigate, token, user, onLogout }) {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [repliedFilter, setRepliedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    const loadSummary = async () => {
      try {
        const payload = await api.getReviewSummary(token);
        if (!isCancelled) {
          setSummary(payload);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.message || "Failed to load review summary.");
        }
      }
    };

    loadSummary();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    const loadReviews = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getReviews(token, {
          page,
          search: searchTerm,
          rating: ratingFilter === "all" ? undefined : ratingFilter,
          replied: repliedFilter === "all" ? undefined : repliedFilter,
        });

        if (!isCancelled) {
          setReviews(payload.items || []);
          setMeta(payload.meta || null);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError?.message || "Failed to load reviews.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isCancelled = true;
    };
  }, [token, page, searchTerm, ratingFilter, repliedFilter]);

  const distributionRows = useMemo(() => {
    const total = Number(summary?.total_reviews || 0);
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = Number(summary?.distribution?.[String(rating)] || 0);
      const percent = total ? Math.round((count / total) * 100) : 0;
      return { rating, count, percent };
    });
  }, [summary]);

  const handleStartReply = (review) => {
    setReplyingReviewId(review.id);
    setReplyText(review.reply || "");
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) {
      setError("Reply text cannot be empty.");
      return;
    }

    setError("");
    try {
      const updated = await api.replyToReview(token, reviewId, replyText.trim());
      setReviews((previous) =>
        previous.map((review) => (review.id === reviewId ? updated : review))
      );
      setReplyingReviewId(null);
      setReplyText("");

      const summaryPayload = await api.getReviewSummary(token);
      setSummary(summaryPayload);
    } catch (requestError) {
      setError(requestError?.message || "Failed to submit reply.");
    }
  };

  const handleExport = () => {
    downloadCsv(
      "customer-reviews.csv",
      ["Review ID", "Customer", "Rating", "Comment", "Reply", "Created At"],
      reviews.map((review) => [
        review.id,
        review.customer?.name || `Customer #${review.customer_id}`,
        review.rating,
        review.comment || "",
        review.reply || "",
        review.created_at || "",
      ])
    );
  };

  return (
    <RestaurantShell
      activePage="reviews"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      title="Customer Reviews"
      headerActions={
        <>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-64"
              placeholder="Search reviews..."
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/5"
            type="button"
            onClick={handleExport}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="text-sm font-semibold">Export</span>
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-primary/10 text-center">
          <p className="text-5xl font-black text-primary mb-2">{summary?.average_rating || 0}</p>
          <div className="flex justify-center gap-0.5 mb-3">{renderStars(Math.round(summary?.average_rating || 0))}</div>
          <p className="text-sm text-slate-500">Based on {summary?.total_reviews || 0} reviews</p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-primary/10">
          <div className="space-y-3">
            {distributionRows.map((row) => (
              <div key={row.rating} className="grid grid-cols-[24px_1fr_60px] items-center gap-4">
                <span className="text-sm font-bold">{row.rating}</span>
                <div className="h-2.5 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${row.percent}%` }}></div>
                </div>
                <span className="text-xs text-slate-500 text-right">{row.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[
          ["all", "All Ratings"],
          ["5", "5 Stars"],
          ["4", "4 Stars"],
          ["3", "3 Stars"],
          ["2", "2 Stars"],
          ["1", "1 Star"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={
              ratingFilter === value
                ? "px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
                : "px-4 py-2 rounded-lg bg-white border border-primary/10 text-sm font-semibold hover:bg-primary/5"
            }
            type="button"
            onClick={() => {
              setPage(1);
              setRatingFilter(value);
            }}
          >
            {label}
          </button>
        ))}

        {[
          ["all", "All Replies"],
          ["pending", "Pending Reply"],
          ["replied", "Replied"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={
              repliedFilter === value
                ? "px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"
                : "px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold hover:bg-slate-50"
            }
            type="button"
            onClick={() => {
              setPage(1);
              setRepliedFilter(value);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {reviews.length ? (
          reviews.map((review) => {
            const isReplying = replyingReviewId === review.id;
            return (
              <div key={review.id} className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-lg leading-tight">
                      {review.customer?.name || `Customer #${review.customer_id}`}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-xs text-slate-400">
                        {review.created_at ? new Date(review.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    className="text-primary hover:underline text-sm font-bold"
                    type="button"
                    onClick={() => handleStartReply(review)}
                  >
                    {review.reply ? "Edit Reply" : "Reply"}
                  </button>
                </div>

                <p className="text-slate-600 leading-relaxed mt-3">{review.comment || "No comment provided."}</p>

                {review.reply && !isReplying ? (
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border-l-2 border-primary">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">Restaurant Reply</span>
                    </div>
                    <p className="text-sm text-slate-600 italic">{review.reply}</p>
                  </div>
                ) : null}

                {isReplying ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
                      rows="3"
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                    ></textarea>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="px-3 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200"
                        type="button"
                        onClick={() => {
                          setReplyingReviewId(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90"
                        type="button"
                        onClick={() => handleSubmitReply(review.id)}
                      >
                        Save Reply
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-6 rounded-xl border border-primary/10 text-sm text-slate-500">
            {loading ? "Loading reviews..." : "No reviews match the selected filters."}
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-2 mt-8 py-4">
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center border border-primary/10 hover:bg-primary/5 disabled:opacity-50"
          type="button"
          onClick={() => setPage((previous) => Math.max(1, previous - 1))}
          disabled={(meta?.current_page || 1) <= 1}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold">
          {meta?.current_page || 1}
        </span>
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center border border-primary/10 hover:bg-primary/5 disabled:opacity-50"
          type="button"
          onClick={() => setPage((previous) => previous + 1)}
          disabled={(meta?.current_page || 1) >= (meta?.last_page || 1)}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </RestaurantShell>
  );
}

