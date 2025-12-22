export default function VerifyEmailMessagePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max_w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Verify your email</h1>
          <p className="text-sm text-slate-600">
            A verification link has been sent to your email address. Please click the link to activate your account.
          </p>
        </div>
      </div>
    </div>
  );
}