
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


// Custom BonicaScribe Logo Component
const BonicaScribeLogo = ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#A0CFEC', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#68A4C4', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" stroke="#E0E0E0" strokeWidth="2"/>
      <path
        d="M42,68 C50,60 52,55 52,50 C52,45 50,40 42,32 M60,68 C52,60 50,55 50,50 C50,45 52,40 60,32"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
       <path
        d="M40,50 h20"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSigningUp) {
        await signUp(email, password);
        toast({
          title: 'Registro exitoso',
          description: '¡Bienvenido! Ahora puedes iniciar sesión.',
        });
        setIsSigningUp(false); // Switch to login view after successful signup
      } else {
        await signIn(email, password);
        router.push('/forms');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: error.message || 'Por favor, verifique sus credenciales e intente de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 login-page-bg">
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <BonicaScribeLogo className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="mt-4 text-2xl font-bold">BonicaScribe</CardTitle>
          <CardDescription>
            {isSigningUp ? 'Crea una cuenta para empezar' : 'Inicia sesión para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Cargando...' : (isSigningUp ? 'Registrarse' : 'Iniciar Sesión')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSigningUp ? (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button onClick={() => setIsSigningUp(false)} className="font-medium text-primary hover:underline">
                  Inicia sesión
                </button>
              </>
            ) : (
              <>
                ¿No tienes una cuenta?{' '}
                <button onClick={() => setIsSigningUp(true)} className="font-medium text-primary hover:underline">
                  Regístrate
                </button>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center gap-4 pt-4">
            <Link href="https://climate.stripe.com/wNksj6" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              Aporte Climático
            </Link>
            <iframe width="300" height="38" style={{border:0, borderRadius: '19px'}} src="https://climate.stripe.com/badge/fQZVoI?theme=light&size=small&locale=es-419"></iframe>
        </CardFooter>
      </Card>
    </div>
  );
}
