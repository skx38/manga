'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SoftSignUpHandler() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const migrateGuestData = async () => {
            if (status === 'authenticated' && session?.user) {
                // Check for guest data
                const guestLibrary = localStorage.getItem('guest_library');
                const guestHistory = localStorage.getItem('guest_history');

                if (guestLibrary || guestHistory) {
                    try {
                        // Call migration API
                        const res = await fetch('/api/user/migrate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                library: guestLibrary ? JSON.parse(guestLibrary) : [],
                                history: guestHistory ? JSON.parse(guestHistory) : []
                            }),
                        });

                        if (res.ok) {
                            // Clear local storage after successful migration
                            localStorage.removeItem('guest_library');
                            localStorage.removeItem('guest_history');
                            console.log('Guest data migrated successfully');

                            // Redirect to Taste Test if it's a new user (we can check a flag or just do it)
                            // For now, let's assume we redirect to onboarding if they have no preferences set
                            // But we don't have that info here easily without fetching user profile.
                            // We'll handle redirection logic separately or assume migration implies new-ish user.
                        }
                    } catch (error) {
                        console.error('Failed to migrate guest data', error);
                    }
                }
            }
        };

        migrateGuestData();
    }, [status, session]);

    return null; // This component doesn't render anything
}
