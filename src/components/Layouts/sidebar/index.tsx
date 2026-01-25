"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  useEffect(() => {
    // Keep collapsible open, when it's subpage is active
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }

            // Break the loop
            return true;
          }
        });
      });
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-stroke-dark bg-dark transition-[width] duration-200 ease-linear dark:border-stroke-dark dark:bg-dark print:hidden",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* User Info */}
          <UserProfile user={user} />

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {NAV_DATA.map((section) => {
              // Filtrado de Secciones y Elementos según Rol
              // Si el usuario no es ADMIN, ocultamos la sección de Administración por completo o elementos específicos
              if (user?.rol !== 'ADMIN') {
                if (section.label === 'Administración') return null;
                // Aquí puedes agregar más lógica si quieres ocultar otras cosas
              }

              return (
                <div key={section.label} className="mb-6">
                  <h2 className="mb-5 text-sm font-medium text-white/50 dark:text-dark-6">
                    {section.label}
                  </h2>

                  <nav role="navigation" aria-label={section.label}>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item.title}>
                          {item.items.length ? (
                            <div>
                              <MenuItem
                                isActive={item.items.some(
                                  ({ url }) => url === pathname,
                                )}
                                onClick={() => toggleExpanded(item.title)}
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span>{item.title}</span>

                                <ChevronUp
                                  className={cn(
                                    "ml-auto rotate-180 transition-transform duration-200",
                                    expandedItems.includes(item.title) &&
                                    "rotate-0",
                                  )}
                                  aria-hidden="true"
                                />
                              </MenuItem>

                              {expandedItems.includes(item.title) && (
                                <ul
                                  className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                  role="menu"
                                >
                                  {item.items.map((subItem) => (
                                    <li key={subItem.title} role="none">
                                      {subItem.items && subItem.items.length > 0 ? (
                                        <div>
                                          <MenuItem
                                            onClick={() => toggleExpanded(subItem.title)}
                                            isActive={subItem.items.some(({ url }) => url === pathname)}
                                            className="text-sm font-medium"
                                          >
                                            <span>{subItem.title}</span>
                                            <ChevronUp
                                              className={cn(
                                                "ml-auto rotate-180 transition-transform duration-200",
                                                expandedItems.includes(subItem.title) &&
                                                "rotate-0",
                                              )}
                                              aria-hidden="true"
                                            />
                                          </MenuItem>

                                          {expandedItems.includes(subItem.title) && (
                                            <ul className="ml-4 space-y-1.5 pt-2">
                                              {subItem.items.map((subSubItem) => (
                                                <li key={subSubItem.title}>
                                                  <MenuItem
                                                    as="link"
                                                    href={subSubItem.url || "/"}
                                                    isActive={pathname === subSubItem.url}
                                                    className="text-sm"
                                                  >
                                                    <span>{subSubItem.title}</span>
                                                  </MenuItem>
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                      ) : (
                                        <MenuItem
                                          as="link"
                                          href={subItem.url || "/"}
                                          isActive={pathname === subItem.url}
                                        >
                                          <span>{subItem.title}</span>
                                        </MenuItem>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            (() => {
                              const href =
                                "url" in item
                                  ? item.url + ""
                                  : "/" +
                                  item.title.toLowerCase().split(" ").join("-");

                              return (
                                <MenuItem
                                  className="flex items-center gap-3 py-3"
                                  as="link"
                                  href={href}
                                  isActive={pathname === href}
                                >
                                  <item.icon
                                    className="size-6 shrink-0"
                                    aria-hidden="true"
                                  />

                                  <span>{item.title}</span>
                                </MenuItem>
                              );
                            })()
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

function UserProfile({ user }: { user?: any }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-stroke bg-white p-3 dark:border-strokedark dark:bg-boxdark mb-4">
      <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-black dark:text-white truncate">{user?.nombre || user?.name || "Usuario"}</p>
        <p className="text-xs text-gray-500 truncate">{user?.rol || "Conectado"}</p>
      </div>
    </div>
  )
}
