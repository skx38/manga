import TasteTestWizard from '@/components/onboarding/TasteTestWizard';

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">OmniRead</span>
                    </h1>
                    <p className="text-xl text-gray-400">Let's personalize your experience.</p>
                </div>

                <TasteTestWizard />
            </div>
        </div>
    );
}
