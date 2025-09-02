
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
          <Stethoscope className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl font-bold">MediScribe Assist</CardTitle>
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
      </Card>
    </div>
  );
}
