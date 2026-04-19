import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationAPI, jobAPI } from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import { User, Mail, GraduationCap, FileText, CheckCircle, XCircle } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const Applicants = () => {
  const { jobId } = useParams(); // ✅ Extract jobId from the URL
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const validJobId = jobId && jobId !== 'undefined';
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [toast, setToast] = useState(null);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobAPI.getJobById(jobId),
    enabled: validJobId,
  });

  const { data: applicants = [], isLoading: applicantsLoading } = useQuery({
    queryKey: ['applicants', jobId],
    queryFn: () => applicationAPI.getJobApplicants(jobId),
    enabled: validJobId,
  });

  const isLoading = jobLoading || applicantsLoading;

  const updateStatusMutation = useMutation({
    mutationFn: ({ applicationId, status }) => applicationAPI.updateApplicationStatus(applicationId, status),
    onSuccess: (_, { applicationId, status }) => {
      queryClient.setQueryData(['applicants', jobId], (old) =>
        old.map((app) => (app._id === applicationId ? { ...app, status } : app))
      );
      setToast({
        message: `Application ${status === 'accepted' ? 'accepted' : 'rejected'}`,
        type: 'success',
      });
      setSelectedApplicant(null);
    },
    onError: () => {
      setToast({ message: 'Failed to update status', type: 'error' });
    },
  });

  const handleUpdateStatus = (applicationId, status) => {
    updateStatusMutation.mutate({ applicationId, status });
  };

  if (!validJobId) {
    return <div className="p-8 text-center text-red-600">Invalid Job ID</div>;
  }

  if (isLoading) return <Loader fullScreen />;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Applicants</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {job?.title || 'Job'} - {applicants.length} application
              {applicants.length !== 1 ? 's' : ''}
            </p>
          </div>

          {job && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Job Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Location:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{job.location}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Type:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{job.type}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Salary:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {job.salaryMin} - {job.salaryMax}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Posted:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {applicants.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No applicants yet</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Applications will appear here once jobseekers apply.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applicants.map((application) => (
                <div
                  key={application._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                        {application.student?.avatarUrl || application.student?.profile?.avatarUrl ? (
                          <img
                            src={resolveMediaUrl(application.student.avatarUrl || application.student?.profile?.avatarUrl)}
                            alt={application.student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                          {application.student.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{application.student.degree}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        application.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : application.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      {application.student.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <GraduationCap className="w-4 h-4" />
                      {application.student.university}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      Applied on{' '}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedApplicant(application)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for applicant details */}
      <Modal
        isOpen={!!selectedApplicant}
        onClose={() => setSelectedApplicant(null)}
        title="Applicant Details"
        size="lg"
      >
        {selectedApplicant && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                {selectedApplicant.student?.avatarUrl || selectedApplicant.student?.profile?.avatarUrl ? (
                  <img
                    src={resolveMediaUrl(
                      selectedApplicant.student.avatarUrl || selectedApplicant.student?.profile?.avatarUrl
                    )}
                    alt={selectedApplicant.student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                  {selectedApplicant.student.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">{selectedApplicant.student.degree}</p>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                  <Mail className="w-4 h-4" />
                  {selectedApplicant.student.email}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedApplicant.status === 'accepted'
                    ? 'bg-green-100 text-green-700'
                    : selectedApplicant.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {selectedApplicant.status}
              </span>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Academic Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-300">University:</span>{' '}
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {selectedApplicant.student.university}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Graduation Year:</span>{' '}
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {selectedApplicant.student.graduationYear}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant.student.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Links</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                {selectedApplicant.student.githubUrl && (
                  <a className="text-blue-600 hover:underline" href={selectedApplicant.student.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
                )}
                {selectedApplicant.student.linkedinUrl && (
                  <a className="text-blue-600 hover:underline" href={selectedApplicant.student.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                )}
                {selectedApplicant.student.resumeUrl && (
                  <div className="flex items-center gap-3">
                    <a className="text-blue-600 hover:underline" href={selectedApplicant.student.resumeUrl} target="_blank" rel="noopener noreferrer">View Resume</a>
                    <a className="text-blue-600 hover:underline" href={selectedApplicant.student.resumeUrl} download>Download Resume</a>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Cover Letter</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {selectedApplicant.coverLetter}
              </p>
            </div>

            <div className="flex justify-between items-center border-t pt-4 gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(`/chat/${selectedApplicant.student._id}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Message Jobseeker
              </button>

              {selectedApplicant.status === 'pending' && (
                <div className="flex justify-end gap-4 ml-auto">
                <button
                  onClick={() => handleUpdateStatus(selectedApplicant._id, 'rejected')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {updateStatusMutation.isPending && updateStatusMutation.variables?.status === 'rejected' ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApplicant._id, 'accepted')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {updateStatusMutation.isPending && updateStatusMutation.variables?.status === 'accepted' ? 'Accepting...' : 'Accept'}
                </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Applicants;