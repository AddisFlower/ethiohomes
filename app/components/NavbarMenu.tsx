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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Element &&
        !target.closest("[data-navbar-dropdown]")
      ) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
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
  }

  const dropdownClass =
    "absolute left-0 top-full z-50 mt-0 w-72 max-w-[calc(100vw-2rem)] rounded-lg border-2 border-emerald-700 bg-white p-5 shadow-xl";

  return (
    <nav className="border-b border-emerald-600 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-3 md:flex-row md:items-center">
        <Link href="/" onClick={closeMenu}>
          <h1 className="cursor-pointer text-2xl font-bold text-black md:text-3xl">
            EthioMLS
          </h1>
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm md:gap-6 md:text-base">
          <div
            data-navbar-dropdown
            className="relative"
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
            data-navbar-dropdown
            className="relative"
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

        <div className="relative md:ml-auto">
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
              data-navbar-dropdown
              className="relative"
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
    </nav>
  );
}
