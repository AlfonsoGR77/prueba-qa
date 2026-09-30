import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'quiet'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0'

const variants: Record<Variant, string> = {
  primary: 'h-10 rounded-full border border-form bg-form px-5 text-sm text-sheet hover:bg-form-strong',
  secondary: 'h-9 rounded-full border border-rule-strong bg-sheet px-3 text-sm text-form hover:border-form hover:bg-form-wash',
  quiet: 'h-8 rounded-md px-2 text-sm text-form underline-offset-4 hover:underline',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'secondary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(base, variants[variant], className)} {...props} />
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
}

/** Un link con la forma de un botón (navega; no ejecuta una acción). */
export function ButtonLink({ variant = 'secondary', className, ...props }: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], 'no-underline', className)} {...props} />
}
