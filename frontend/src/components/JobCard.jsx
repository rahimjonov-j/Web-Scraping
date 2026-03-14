export default function JobCard({ job }) {
  return (
    <article className="card">
      <div className="card-body">
        <h3>{job.title}</h3>
        <p className="company">{job.company || "Company not listed"}</p>
        <p className="meta">
          <span>{job.location || "Location not listed"}</span>
          <span>{job.salary || "Salary not listed"}</span>
        </p>
      </div>
      <a
        className="button"
        href={job.link}
        target="_blank"
        rel="noreferrer"
      >
        View Job
      </a>
    </article>
  );
}
