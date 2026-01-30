module.exports = {
    apps: [
        {
            name: "rt_operaciones",
            script: "npm",
            args: "run dev",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
                AUTH_TRUST_HOST: "true",
                AUTH_URL: "http://localhost:3000",
            },
        },
    ],
};
