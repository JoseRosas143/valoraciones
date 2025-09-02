
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

const GoogleLogo = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
    >
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238
	C42.718,34.566,44,30.035,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle } = useAuth();
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
        await signInWithGoogle();
        router.push('/forms');
    } catch (error: any) {
        console.error('Google Sign In error:', error);
        toast({
            variant: 'destructive',
            title: 'Error con Google',
            description: error.message || 'No se pudo iniciar sesión con Google.',
        });
    } finally {
        setIsLoading(false);
    }
  }

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
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                O continúa con
                </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            <GoogleLogo className="mr-2 h-5 w-5" />
            Google
          </Button>

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
