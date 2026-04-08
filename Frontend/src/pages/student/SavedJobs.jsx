import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, applicationAPI, jobAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import JobCard from '../../components/JobCard';

const SavedJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [toast, setToast] = useState(null);

  // Apply modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  const loadSavedJobs = async () => {
    setLoading(true);
    try {
      const list = await userAPI.getSavedJobs();
      setSavedJobs(list || []);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      const msg = error?.message || error?.data?.message || 'Failed to load saved jobs';
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!selectedJob?._id) return;
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

  const handleToggleSave = async (job) => {
    if (!job?._id) return;
    try {
      await jobAPI.unsaveJob(job._id);
      setSavedJobs((prev) => prev.filter((j) => j._id !== job._id));
      setToast({ message: 'Removed from saved jobs', type: 'success' });
    } catch (error) {
      console.error('Error removing saved job:', error);
      const msg = error?.message || error?.data?.message || 'Failed to update saved job';
      setToast({ message: msg, type: 'error' });
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Saved Jobs</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {savedJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No saved jobs yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Save jobs from the job search page.</p>
              <button
                type="button"
                onClick={() => navigate('/jobseeker/jobs')}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onApply={handleApply}
                  isSaved
                  onToggleSave={handleToggleSave}
                />
              ))}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Letter</label>
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

export default SavedJobs;

