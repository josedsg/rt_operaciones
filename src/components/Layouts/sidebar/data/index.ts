import * as Icons from "../icons";

interface MenuItem {
  title: string;
  url?: string;
  icon?: any;
  items: MenuItem[];
}

export const NAV_DATA: { label: string; items: MenuItem[] }[] = [
  {
    label: "Operaciones",
    items: [
      {
        title: "Clientes",
        url: "#",
        icon: Icons.User,
        items: [
          {
            title: "Directorio",
            url: "/clientes",
            items: [],
          },
          {
            title: "Configuración",
            url: "#",
            items: [
              { title: "Tipos de Cliente", url: "/clientes/configuracion/tipos-cliente", items: [] },
              { title: "Terminales", url: "/clientes/configuracion/terminales", items: [] },
              { title: "Agencias", url: "/clientes/configuracion/agencias", items: [] },
              { title: "Términos de Pago", url: "/clientes/configuracion/terminos-pago", items: [] },
              { title: "Geografía", url: "/clientes/configuracion/geografia", items: [] },
            ],
          },
        ],
      },
      {
        title: "Productos",
        url: "#",
        icon: Icons.FourCircle,
        items: [
          {
            title: "Maestros",
            url: "/productos/maestros",
            items: [],
          },
          {
            title: "Configuración",
            items: [
              { title: "Grupos", url: "/productos/configuracion/grupos", items: [] },
              { title: "Familias", url: "/productos/configuracion/familias", items: [] },
              { title: "Variantes", url: "/productos/configuracion/variantes", items: [] },
              { title: "Tamaños", url: "/productos/configuracion/tamanos", items: [] },
              { title: "Empaques", url: "/productos/configuracion/empaques", items: [] },
              { title: "Tipos Empaque", url: "/productos/configuracion/tipos-empaque", items: [] },
            ],
            url: "#",
            icon: Icons.Table,
          },
        ],
      },
      {
        title: "Ventas",
        url: "/ventas",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "Exportaciones",
        url: "#",
        icon: Icons.Table,
        items: [
          {
            title: "Tablero",
            url: "/exportaciones/dashboard",
            items: []
          },
          {
            title: "Lista de Exportaciones",
            url: "/exportaciones",
            items: []
          },
          {
            title: "Simulador Packing List",
            url: "/exportaciones/packing-list",
            items: []
          }
        ],
      },
    ],
  },
  {
    label: "Compras",
    items: [
      {
        title: "Proveedores",
        url: "/compras/proveedores",
        icon: Icons.User,
        items: [],
      },
    ],
  },
  {
    label: "Producción",
    items: [
      {
        title: "Tablero",
        url: "/produccion/tablero",
        icon: Icons.PieChart, // Placeholder icon
        items: [],
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        title: "Usuarios",
        url: "/usuarios",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Migración Mayúsculas",
        url: "/ventas/admin/migrate",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Limpiar Base de Datos",
        url: "/ventas/admin/clear-db",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "Carga Inicial Productos",
        url: "/ventas/admin/carga-inicial",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Carga Inicial Clientes",
        url: "/ventas/admin/carga-inicial-clientes",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Configuración General",
        url: "#",
        icon: Icons.Settings,
        items: [
          {
            title: "Datos Empresa",
            url: "/configuracion/empresa",
            items: [],
          }
        ],
      },
    ],
  },
];
