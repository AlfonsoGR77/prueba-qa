import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { paths } from '@/config/paths'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '../auth-context'

/** Lógica del formulario de login (la vista queda en LoginForm.tsx). */
export function useLoginForm() {
  const { actions } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? paths.dashboard

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    if (!email || !password) {
      setError('Escribe tu email y tu contraseña.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await actions.login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const apiError = ApiError.from(err)
      setError(
        apiError.status === 401
          ? 'Email o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.'
          : apiError.message,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return { onSubmit, submitting, error }
}
