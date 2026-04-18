import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobAPI, applicationAPI, userAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import JobCard from '../../components/JobCard';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import Loader from '../../components/Loader';
import { Search, MapPin, Briefcase, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';

const JobSearch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    type: '',
    salaryMin: '',
    salaryMax: '',
  });
  const [page, setPage] = useState(1);

  // Modals / Applications
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState(null);

  // Debounced filter values
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedLocation = useDebounce(filters.location, 500);
  const debouncedType = useDebounce(filters.type, 500);
  // Optional: debounce numbers too so rapid typing doesn't trigger requests
  const debouncedSalaryMin = useDebounce(filters.salaryMin, 500);
  const debouncedSalaryMax = useDebounce(filters.salaryMax, 500);

  // Query: Saved Jobs
  const { data: savedJobsData } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => userAPI.getSavedJobs(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
  const savedJobIds = savedJobsData ? savedJobsData.map((j) => j._id) : [];

  // Query: Jobs Pagination & Search
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'jobs',
      page,
      debouncedSearch,
      debouncedLocation,
      debouncedType,
      debouncedSalaryMin,
      debouncedSalaryMax,
    ],
    queryFn: () =>
      jobAPI.getAllJobs({
        page,
        limit: 9,
        search: debouncedSearch,
        location: debouncedLocation,
        type: debouncedType,
        salaryMin: debouncedSalaryMin,
        salaryMax: debouncedSalaryMax,
      }),
    placeholderData: keepPreviousData, // Preserve job cards visually while fetching next page or filter
  });

  const jobs = data?.jobs || [];
  const pages = data?.pages || 1;
  const total = data?.total || jobs.length || 0;

  // Mutation: Save / Unsave Job
  const toggleSaveMutation = useMutation({
    mutationFn: async (jobId) => {
      if (savedJobIds.includes(jobId)) {
        await jobAPI.unsaveJob(jobId);
      } else {
        await jobAPI.saveJob(jobId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
    onError: (error) => {
      const msg = error?.message || error?.data?.message || 'Failed to update saved job';
      setToast({ message: msg, type: 'error' });
    },
  });

  const handleToggleSave = (job) => {
    if (job?._id) toggleSaveMutation.mutate(job._id);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1); // Reset page on filter changes
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setToast({ message: 'Please log in to apply for jobs', type: 'error' });
      return;
    }

    setApplying(true);
    try {
      await applicationAPI.applyForJob(selectedJob._id, { coverLetter });
      setToast({ message: 'Application submitted successfully!', type: 'success' });
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (error) {
      console.error('Application submission error:', error);
      const msg =
        error?.message ||
        error?.data?.message ||
        error?.response?.data?.message ||
        'Failed to submit application';
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

  // Only show the blocking fullScreen loader on the EXACT first mount
  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Find Your Dream Job</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Browse through {total || jobs.length} available opportunities
              </p>
            </div>
            {/* Elegant sub-loader that pulses when a background fetch (like filtering) occurs without unmounting UI */}
            {isFetching && (
              <div className="hidden sm:flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full font-medium">
                <Loader size="sm" /> Updating list...
              </div>
            )}
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

          {/* Opacity shifts to 50% during background fetching so users know data is refreshing */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
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

          {!isFetching && jobs.length === 0 && (
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