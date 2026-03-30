# Acesso de demonstração (produção)

Conta criada/atualizada via SQL no Supabase para apresentações do painel admin.

| Campo | Valor |
|--------|--------|
| URL de login | `https://<seu-dominio>/admin/login` |
| E-mail | `demo.showcase@flordoestudante.com.br` |
| Senha | `FlorDemo2026!Show` |

- Perfil: **manager** em `public.admins`.
- A senha é **reaplicada** sempre que o script SQL de showcase é executado (mesmo e-mail).
- **Após a demo:** desative o utilizador em `public.admins` (`is_active = false`) ou altere a senha no Supabase Auth; não use esta conta como único admin de produção.

O administrador principal existente (`admin@flordoestudante.com.br`) não é alterado por este fluxo.
