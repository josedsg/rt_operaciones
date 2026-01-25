'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { authenticate } from '@/actions/auth-actions';
import { Logo } from '@/components/logo';

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="flex min-h-screen items-center justify-center bg-boxdark-2 px-4 py-10 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-default dark:bg-boxdark">
                <div className="flex flex-col items-center justify-center">
                    <div className="scale-150 mb-4">
                        <Logo />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-black dark:text-white">
                        Iniciar Sesión
                    </h2>
                </div>
                <form action={dispatch} className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Correo Electrónico
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border border-stroke bg-transparent px-3 py-3 text-black placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none dark:border-strokedark dark:text-white dark:focus:border-primary sm:text-sm"
                                placeholder="Correo Electrónico"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border border-stroke bg-transparent px-3 py-3 text-black placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none dark:border-strokedark dark:text-white dark:focus:border-primary sm:text-sm"
                                placeholder="Contraseña"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            {/* Optional: Forgot password link */}
                        </div>
                    </div>

                    <div>
                        <LoginButton />
                    </div>
                    <div
                        className="flex h-8 items-end space-x-1"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {errorMessage && (
                            <p className="text-sm text-danger">{errorMessage}</p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-opacity-50"
            disabled={pending}
        >
            {pending ? 'Ingresando...' : 'Ingresar'}
        </button>
    );
}
