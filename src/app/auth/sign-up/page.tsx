import SignInWithGoogleButton from '@/components/get-started-button';
import SignupHeroEffects from '@/components/signup/SignupHeroEffects';
import AuthErrorToast from '@/components/auth/AuthErrorToast';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>
      <SignupHeroEffects />
      <div>
        <div className="relative z-10 mt-24 flex w-5/12 flex-col items-center justify-center">
          <div className="flex flex-row">
            <p className="font-roboto text-9xl text-[#fafaf7]">st</p>
            <p className="font-roboto text-9xl text-[#8a8bde]">a</p>
            <p className="font-roboto text-9xl text-[#fafaf7]">s</p>
            <p className="font-roboto text-9xl text-[#8a8bde]">i</p>
            <p className="font-roboto text-9xl text-[#fafaf7]">s</p>
          </div>

          <div className="p-6 text-center">
            <SignInWithGoogleButton />
          </div>
        </div>
        <div className="h-full bg-red-500"></div>
      </div>
    </main>
  );
}
