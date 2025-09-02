
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
    const publishableKey = "pk_live_51S2rUEKQEealPn90ZBYa7u4hvO0YkSRWLmqUq3paCcE98h4w61KoYO20Y5xO2sAITk9BxMgRchgF2FYmcLdjB9Bb00Cho3oB6s";

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
                <CardFooter className="flex-col items-center gap-4 pt-6">
                   <p className="text-sm text-muted-foreground text-center">Un porcentaje de nuestros ingresos se destina a la eliminación de CO₂.</p>
                   <iframe width="420" height="38" style={{border:0, borderRadius: '19px', maxWidth: '100%'}} src="https://climate.stripe.com/badge/fQZVoI?theme=light&size=small&locale=es-419"></iframe>
                </CardFooter>
            </Card>
        </div>
    );
}
