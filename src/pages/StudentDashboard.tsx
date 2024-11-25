import { useState, useEffect } from 'react';
import { LogOut, BookOpen, GraduationCap, Clock, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';

export function StudentDashboard() {
  const { signOut, user } = useAuthStore();
  const { enrollments, courses, loading, error, fetchStudentEnrollments, enrollInCourse } = useCourseStore();
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudentEnrollments(user.id);
    }
  }, [user, fetchStudentEnrollments]);

  const handleEnroll = async (courseId: string) => {
    if (user) {
      await enrollInCourse(user.id, courseId);
      setShowEnrollModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold">Student Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Enroll in Course
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Enrolled Courses
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {loading ? '...' : enrollments.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Enrollments</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {loading ? (
                  <li className="p-4 text-center text-gray-500">Loading enrollments...</li>
                ) : enrollments.length === 0 ? (
                  <li className="p-4 text-center text-gray-500">No enrollments yet</li>
                ) : (
                  enrollments.map((enrollment) => (
                    <li key={enrollment.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {enrollment.course.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            {enrollment.course.description}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {showEnrollModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Courses</h3>
                <div className="space-y-4">
                  {courses.map((course) => {
                    const isEnrolled = enrollments.some(
                      (e) => e.course_id === course.id
                    );
                    return (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {course.title}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            {course.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={isEnrolled}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            isEnrolled
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isEnrolled ? 'Enrolled' : 'Enroll'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}