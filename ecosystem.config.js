module.exports = {
    apps: [
        {
            name: "rt_operaciones",
            script: "npm",
            args: "start", // IMPORTANTE: Usa 'start', no 'run dev'
            env: {
                NODE_ENV: "production",
                // Si usas NextAuth, añade esta línea:
                NEXTAUTH_URL: "https://operaciones.riotapezco.net",
                // Si usas variables personalizadas para redirecciones:
                NEXT_PUBLIC_BASE_URL: "https://operaciones.riotapezco.net",
                // AUTH config
                AUTH_SECRET: "Ew883WM/6mXZwX5XYdD1+T9ehs2Pzx9FJipBQjrTkxQ=",
                AUTH_TRUST_HOST: "true"
            },
        },
    ],
};

