'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@flordoestudante/ui';
import { Button } from '@flordoestudante/ui';
import { Input } from '@flordoestudante/ui';
import { Label } from '@flordoestudante/ui';
import Link from 'next/link';

export function AdminLoginForm() {
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-serif text-2xl">Área do lojista</CardTitle>
        <CardDescription>
          Faça login para acessar o painel. Integração com Supabase Auth nas próximas etapas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="admin@exemplo.com" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" placeholder="••••••••" disabled />
        </div>
        <Button className="w-full" disabled>
          Entrar (em breve)
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Voltar ao site
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
