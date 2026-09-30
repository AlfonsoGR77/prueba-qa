import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/inputs'
import { useLoginForm } from './useLoginForm'

export function LoginForm() {
  const { onSubmit, submitting, error } = useLoginForm()

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
      />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
      />

      {error ? (
        <p role="alert" className="border border-critical/40 bg-critical-wash px-3 py-2 text-sm text-critical">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={submitting} className="mt-1 w-full">
        <LogIn aria-hidden className="size-4" />
        {submitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
