module.exports = {
    apps: [
        {
            name: "rt_operaciones",
            script: "npm",
            args: "run dev", // IMPORTANTE: Usa 'start', no 'run dev'
            env: {
                NODE_ENV: "production",
                // Si usas NextAuth, añade esta línea:
                NEXTAUTH_URL: "https://rt-dev.neosyscr.com",
                // Si usas variables personalizadas para redirecciones:
                NEXT_PUBLIC_BASE_URL: "https://rt-dev.neosyscr.com"
            },
        },
    ],
};

