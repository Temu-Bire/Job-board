import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobAPI, applicationAPI, userAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import JobCard from '../../components/JobCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import Loader from '../../components/Loader';
import { Search, MapPin, Briefcase, Filter } from 'lucide-react';

const JobSearch = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    type: '',
    salaryMin: '',
    salaryMax: '',
  });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Load saved jobs once so the Save/Unsaved button state is correct.
    const loadSavedJobs = async () => {
      try {
        const savedJobs = await userAPI.getSavedJobs();
        setSavedJobIds((savedJobs || []).map((j) => j._id));
      } catch (e) {
        // If it fails, still allow browsing/applying.
        setSavedJobIds([]);
      }
    };
    loadSavedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchJobs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.search, filters.location, filters.type, filters.salaryMin, filters.salaryMax]);

  const handleToggleSave = async (job) => {
    const jobId = job?._id;
    if (!jobId) return;

    try {
      if (savedJobIds.includes(jobId)) {
        await jobAPI.unsaveJob(jobId);
        setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
      } else {
        await jobAPI.saveJob(jobId);
        setSavedJobIds((prev) => [...prev, jobId]);
      }
    } catch (error) {
      const msg = error?.message || error?.data?.message || 'Failed to update saved job';
      setToast({ message: msg, type: 'error' });
    }
  };

  const fetchJobs = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const response = await jobAPI.getAllJobs({
        page: pageToLoad,
        limit: 9,
        search: filters.search,
        location: filters.location,
        type: filters.type,
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
      });
      setJobs(response.jobs || []);
      setPage(response.page || pageToLoad);
      setPages(response.pages || 1);
      setTotal(response.total || (response.jobs || []).length);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setToast({ message: 'Failed to load jobs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setToast({ 
        message: 'Please log in to apply for jobs', 
        type: 'error' 
      });
      return;
    }

    setApplying(true);
    try {
      const applicationData = {
        coverLetter,
      };
      
      await applicationAPI.applyForJob(selectedJob._id, applicationData);
      setToast({ 
        message: 'Application submitted successfully!', 
        type: 'success' 
      });
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (error) {
      console.error('Application submission error:', error);
      const msg = error?.message || error?.data?.message || error?.response?.data?.message || 'Failed to submit application';
      if (error.response?.status === 401) {
        setToast({ message: 'Session expired. Please log in again.', type: 'error' });
        localStorage.removeItem('token');
      } else {
        setToast({ message: msg, type: 'error' });
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Find Your Dream Job</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Browse through {total || jobs.length} available opportunities
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search by job title or company"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="Location"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  >
                    <option value="">All Types</option>
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salary Range (Min / Max)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="salaryMin"
                    value={filters.salaryMin}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  />
                  <input
                    type="number"
                    name="salaryMax"
                    value={filters.salaryMax}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 text-gray-600 dark:text-gray-300">
            Showing page {page} of {pages} ({total} job{total !== 1 ? 's' : ''})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onApply={handleApply}
                onToggleSave={handleToggleSave}
                isSaved={savedJobIds.includes(job._id)}
              />
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No jobs found matching your criteria</p>
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700 dark:text-gray-300 text-sm">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pages))}
                disabled={page === pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Position"
      >
        {selectedJob && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{selectedJob.title}</h3>
              <p className="text-blue-600 font-semibold">{selectedJob.company}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              <div><strong>Location:</strong> {selectedJob.location}</div>
              <div><strong>Type:</strong> {selectedJob.type}</div>
              <div><strong>Salary:</strong> {selectedJob.salaryMin} - {selectedJob.salaryMax}</div>
              <div><strong>Openings:</strong> {selectedJob.openings || '-'}</div>
              <div><strong>Apply From:</strong> {selectedJob.applicationStart ? new Date(selectedJob.applicationStart).toLocaleDateString() : '—'}</div>
              <div><strong>Apply Until:</strong> {selectedJob.applicationEnd ? new Date(selectedJob.applicationEnd).toLocaleDateString() : '—'}</div>
              {selectedJob.contactEmail && (
                <div><strong>Contact Email:</strong> <a className="text-blue-600 hover:underline" href={`mailto:${selectedJob.contactEmail}`}>{selectedJob.contactEmail}</a></div>
              )}
              {selectedJob.contactWebsite && (
                <div><strong>Website:</strong> <a className="text-blue-600 hover:underline" href={selectedJob.contactWebsite} target="_blank" rel="noreferrer">{selectedJob.contactWebsite}</a></div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows="6"
                placeholder="Tell us why you're a great fit for this position..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-4 border-t pt-4">
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={applying || !coverLetter.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default JobSearch;