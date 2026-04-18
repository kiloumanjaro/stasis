import { PomodoroContent } from '@/components/pomodoro/PomodoroContent';
import { CameraProvider, CVProvider } from '@/features/camera';

export default function PomodoroPage() {
  return (
    <CameraProvider>
      <CVProvider>
        <PomodoroContent />
      </CVProvider>
    </CameraProvider>
  );
}
