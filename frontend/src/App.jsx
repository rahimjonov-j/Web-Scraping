import { useEffect, useMemo, useState } from "react";
import JobGrid from "./components/JobGrid.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";

const OPTIONS = [
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Web Design", value: "web-design" },
];

export default function App() {
  const [selected, setSelected] = useState("frontend");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedLabel = useMemo(
    () => OPTIONS.find((option) => option.value === selected)?.label ?? "",
    [selected],
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const apiBase = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${apiBase}/api/jobs?type=${selected}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Server error. Please try again.");
        }

        const data = await response.json();
        if (isMounted) {
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted && err.name !== "AbortError") {
          setError(err.message || "Failed to load jobs.");
          setJobs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selected]);

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Automated job search</p>
        <h1>Job Finder</h1>
        <p className="subtitle">
          Select a category and we will pull fresh vacancies from hh.uz.
        </p>
        <div className="controls">
          <label htmlFor="job-type">Category</label>
          <select
            id="job-type"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="results">
        <div className="results-header">
          <h2>{selectedLabel} Roles</h2>
          {!loading && error && <span className="status error">{error}</span>}
        </div>

        {loading && <LoadingSpinner />}
        {!loading && !error && jobs.length === 0 && (
          <div className="empty">No jobs found for this category yet.</div>
        )}

        {!loading && !error && jobs.length > 0 && <JobGrid jobs={jobs} />}
      </section>
    </div>
  );
}
