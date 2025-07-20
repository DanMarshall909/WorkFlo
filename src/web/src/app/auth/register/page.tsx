import RegisterForm from '@/components/auth/RegisterForm';
import AuthGuard from '@/components/auth/AuthGuard';

export default function RegisterPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/tasks">
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-on-primary font-bold text-xl">A</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-on-background">
          Join WorkFlo
        </h2>
        <p className="mt-2 text-center text-sm text-on-surface-variant">
          Create your privacy-protected workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-primary-container border border-primary rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-on-primary-container">Privacy First</h3>
              <p className="mt-1 text-xs text-on-primary-container opacity-90">
                Your account uses local encryption and privacy-preserving authentication. 
                We never track or sell your data.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}