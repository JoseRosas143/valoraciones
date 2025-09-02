
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Script from 'next/script';

// This is a workaround for to make TypeScript happy with the custom element
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

export default function PricingPage() {
    const { user } = useAuth();
    const pricingTableId = 'prctbl_1S2twhKQEealPn90TRqSUhkM'; 
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    useEffect(() => {
        const pricingTable = document.querySelector('stripe-pricing-table');
        if (pricingTable && user?.email) {
            pricingTable.setAttribute('customer-email', user.email);
        }
    }, [user]);

    if (!publishableKey) {
        return (
            <div className="p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Error de Configuración</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>La clave publicable de Stripe no está configurada. Por favor, añádala a sus variables de entorno.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8">
            <Script async src="https://js.stripe.com/v3/pricing-table.js"></Script>
            <Card>
                <CardHeader>
                    <CardTitle>Planes de Suscripción</CardTitle>
                    <CardDescription>
                        Elige el plan que mejor se adapte a tus necesidades para desbloquear formularios ilimitados y todas las funcionalidades.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <stripe-pricing-table
                        pricing-table-id={pricingTableId}
                        publishable-key={publishableKey}
                    >
                    </stripe-pricing-table>
                </CardContent>
            </Card>
        </div>
    );
}
