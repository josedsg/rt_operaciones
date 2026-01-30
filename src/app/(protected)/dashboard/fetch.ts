import { getDashboardDataAction } from "@/actions/dashboard";

export async function getOverviewData() {
    const data = await getDashboardDataAction();

    return {
        views: {
            value: data.stats.totalVentas,
            growthRate: 0.43,
        },
        profit: {
            value: data.stats.cantidadPedidos,
            growthRate: 4.35,
        },
        products: {
            value: data.stats.clientesTotales,
            growthRate: 2.59,
        },
        users: {
            value: data.stats.cajasTotales,
            growthRate: -0.95,
        },
    };
}

export async function getChatsData() {
    return [
        {
            profile: "/images/user/user-01.png",
            name: "Devid Hebert",
            isActive: true,
            unreadCount: 3,
            lastMessage: {
                content: "Hello, how are you?",
                timestamp: new Date().toISOString(),
            },
        },
        {
            profile: "/images/user/user-02.png",
            name: "Jhon Doe",
            isActive: false,
            unreadCount: 0,
            lastMessage: {
                content: "Can you help me with this?",
                timestamp: new Date().toISOString(),
            },
        }
    ];
}
