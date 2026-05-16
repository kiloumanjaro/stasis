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
      <div className="flex flex-col md:flex-row">
        <div className="relative z-10 mt-12 flex w-full flex-col items-center justify-center md:mt-24 md:w-5/12">
          <div className="flex flex-row">
            <p className="font-roboto text-[5rem] text-[#fafaf7] sm:text-[7.5rem] md:text-[10rem]">
              st
            </p>
            <p className="font-roboto text-[5rem] text-[#8a8bde] sm:text-[7.5rem] md:text-[10rem]">
              a
            </p>
            <p className="font-roboto text-[5rem] text-[#fafaf7] sm:text-[7.5rem] md:text-[10rem]">
              s
            </p>
            <p className="font-roboto text-[5rem] text-[#8a8bde] sm:text-[7.5rem] md:text-[10rem]">
              i
            </p>
            <p className="font-roboto text-[5rem] text-[#fafaf7] sm:text-[7.5rem] md:text-[10rem]">
              s
            </p>
          </div>

          <div className="p-6 text-center">
            <SignInWithGoogleButton />
          </div>
        </div>
        <div className="hidden h-full bg-red-500 md:block md:w-7/12"></div>
      </div>
    </main>
  );
}
