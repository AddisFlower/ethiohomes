"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MenuName = "search" | "listings" | "account";

type NavbarMenuProps = {
  canUseAdmin: boolean;
  canUseAgent: boolean;
  displayName: string;
  isAuthenticated: boolean;
};

export default function NavbarMenu({
  canUseAdmin,
  canUseAgent,
  displayName,
  isAuthenticated,
}: NavbarMenuProps) {
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Element &&
        !target.closest("[data-navbar-interactive]")
      ) {
        setOpenMenu(null);
        setIsMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleMenu(menu: MenuName) {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  }

  function closeMenu() {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  }

  function openDesktopMenu(menu: MenuName) {
    setOpenMenu(menu);
  }

  function closeDesktopMenu(menu: MenuName) {
    setOpenMenu((currentMenu) =>
      currentMenu === menu ? null : currentMenu
    );
  }

  const dropdownClass =
    "absolute left-0 top-full z-50 mt-0 w-72 max-w-[calc(100vw-2rem)] rounded-lg border-2 border-emerald-700 bg-white p-5 shadow-xl";

  return (
    <nav className="border-b border-emerald-600 bg-white shadow-sm">
      <div
        data-navbar-interactive
        className="mx-auto max-w-7xl px-4 py-3"
      >
        <div className="flex items-center justify-between md:hidden">
          <Link href="/" onClick={closeMenu}>
            <h1 className="cursor-pointer text-2xl font-bold text-black">
              EthioMLS
            </h1>
          </Link>

          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={
              isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            onClick={() => {
              setOpenMenu(null);
              setIsMobileMenuOpen((isOpen) => !isOpen);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-700 text-emerald-700 transition hover:bg-emerald-50"
          >
            <span className="sr-only">
              {isMobileMenuOpen ? "Close menu" : "Open menu"}
            </span>
            <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
              <span
                className={`h-0.5 w-full bg-current transition ${
                  isMobileMenuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full bg-current transition ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full bg-current transition ${
                  isMobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        <div
          id="mobile-navigation"
          className={`mt-3 border-t border-gray-200 pt-4 md:hidden ${
            isMobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <div className="grid gap-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                Search
              </p>
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                <Link
                  href="/listings?category=Residential&transactionType=For%20Sale"
                  onClick={closeMenu}
                  className="rounded-lg bg-gray-50 px-3 py-3 font-semibold text-gray-800"
                >
                  Residential Sale
                </Link>
                <Link
                  href="/listings?category=Residential&transactionType=For%20Rent"
                  onClick={closeMenu}
                  className="rounded-lg bg-gray-50 px-3 py-3 font-semibold text-gray-800"
                >
                  Residential Rent
                </Link>
                <Link
                  href="/listings?propertyType=Land"
                  onClick={closeMenu}
                  className="rounded-lg bg-gray-50 px-3 py-3 font-semibold text-gray-800"
                >
                  Land
                </Link>
                <Link
                  href="/listings?category=Commercial"
                  onClick={closeMenu}
                  className="rounded-lg bg-gray-50 px-3 py-3 font-semibold text-gray-800"
                >
                  Commercial
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                Listings
              </p>
              <div className="grid gap-2">
                <Link
                  href="/listings"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Browse Listings
                </Link>
                {canUseAgent && (
                  <>
                    <Link
                      href="/add-listing"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Add Listing
                    </Link>
                    <Link
                      href="/my-listings"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Manage Listings
                    </Link>
                    <Link
                      href="/showing-requests"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Showing Requests
                    </Link>
                  </>
                )}
                {canUseAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Admin Review
                  </Link>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800"
                >
                  Sign In
                </Link>
              ) : (
                <div className="grid gap-2">
                  <p className="truncate px-3 text-sm font-semibold text-emerald-700">
                    {displayName}
                  </p>
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" onClick={closeMenu}>
            <h1 className="cursor-pointer text-3xl font-bold text-black">
              EthioMLS
            </h1>
          </Link>

          <div className="flex items-center gap-6 text-base">
            <div
              data-navbar-interactive
              className="relative"
              onMouseEnter={() => openDesktopMenu("search")}
              onMouseLeave={() => closeDesktopMenu("search")}
            >
              <button
                type="button"
                aria-expanded={openMenu === "search"}
                aria-controls="search-menu"
                onClick={() => toggleMenu("search")}
                className="font-semibold text-gray-800 transition hover:text-emerald-700"
              >
                Search
              </button>

              <div
                id="search-menu"
                className={`${dropdownClass} ${
                  openMenu === "search" ? "block" : "hidden"
                }`}
              >
                <div className="flex flex-col gap-3 text-gray-700">
                  <Link
                    href="/listings?category=Residential&transactionType=For%20Sale"
                    onClick={closeMenu}
                  >
                    Residential Sale
                  </Link>
                  <Link
                    href="/listings?category=Residential&transactionType=For%20Rent"
                    onClick={closeMenu}
                  >
                    Residential Rent
                  </Link>
                  <Link
                    href="/listings?propertyType=Land"
                    onClick={closeMenu}
                  >
                    Land
                  </Link>
                  <Link
                    href="/listings?category=Commercial"
                    onClick={closeMenu}
                  >
                    Commercial
                  </Link>
                </div>
              </div>
            </div>

            <div
              data-navbar-interactive
              className="relative"
              onMouseEnter={() => openDesktopMenu("listings")}
              onMouseLeave={() => closeDesktopMenu("listings")}
            >
              <button
                type="button"
                aria-expanded={openMenu === "listings"}
                aria-controls="listings-menu"
                onClick={() => toggleMenu("listings")}
                className="font-semibold text-gray-800 transition hover:text-emerald-700"
              >
                Listings
              </button>

              <div
                id="listings-menu"
                className={`${dropdownClass} ${
                  openMenu === "listings" ? "block" : "hidden"
                }`}
              >
                <div className="flex flex-col gap-3 text-gray-700">
                  <Link href="/listings" onClick={closeMenu}>
                    Browse Listings
                  </Link>

                  {canUseAgent && (
                    <>
                      <Link href="/add-listing" onClick={closeMenu}>
                        Add Listing
                      </Link>
                      <Link href="/my-listings" onClick={closeMenu}>
                        Manage Listings
                      </Link>
                      <Link href="/showing-requests" onClick={closeMenu}>
                        Showing Requests
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {canUseAdmin && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="font-semibold text-gray-800 transition hover:text-emerald-700"
              >
                Admin
              </Link>
            )}
          </div>

          <div className="relative ml-auto">
            {!isAuthenticated ? (
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-full border border-emerald-700 px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Sign In
              </Link>
            ) : (
              <div
                data-navbar-interactive
                className="relative"
                onMouseEnter={() => openDesktopMenu("account")}
                onMouseLeave={() => closeDesktopMenu("account")}
              >
                <button
                  type="button"
                  aria-expanded={openMenu === "account"}
                  aria-controls="account-menu"
                  onClick={() => toggleMenu("account")}
                  className="rounded-full border border-emerald-700 px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  {displayName}
                </button>

                <div
                  id="account-menu"
                  className={`${dropdownClass} w-56 md:left-auto md:right-0 ${
                    openMenu === "account" ? "block" : "hidden"
                  }`}
                >
                  <div className="flex flex-col gap-3 text-gray-700">
                    <Link href="/" onClick={closeMenu}>
                      Dashboard
                    </Link>
                    {canUseAgent && (
                      <>
                        <Link href="/my-listings" onClick={closeMenu}>
                          My Listings
                        </Link>
                        <Link href="/showing-requests" onClick={closeMenu}>
                          Showing Requests
                        </Link>
                        <Link href="/add-listing" onClick={closeMenu}>
                          Add Listing
                        </Link>
                      </>
                    )}
                    {canUseAdmin && (
                      <Link href="/admin" onClick={closeMenu}>
                        Admin Review
                      </Link>
                    )}
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        className="text-left hover:text-emerald-700"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
