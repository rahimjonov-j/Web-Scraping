import JobCard from "./JobCard.jsx";

export default function JobGrid({ jobs }) {
  return (
    <div className="grid">
      {jobs.map((job, index) => (
        <JobCard key={`${job.link}-${index}`} job={job} />
      ))}
    </div>
  );
}
