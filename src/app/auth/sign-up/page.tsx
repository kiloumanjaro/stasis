import SignInWithGoogleButton from '@/components/get-started-button';
import Aurora from '@/components/signup/Aurora';
import FallingText from '@/components/signup/FallingText';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      <Aurora
        colorStops={['#7cff67', '#B19EEF', '#5227FF']}
        blend={0.81}
        amplitude={10.0}
        speed={1}
      />
      <div>
        <FallingText
          text={`A state of stability and balance between stress and boredom`}
          highlightWords={['stability', 'balance', 'stress', 'boredom']}
          trigger="auto"
          backgroundColor="transparent"
          wireframes={false}
          gravity={0.56}
          fontSize="4rem"
          mouseConstraintStiffness={0.9}
        />
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
