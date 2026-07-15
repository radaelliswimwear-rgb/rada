"use client";

import {
  ClipboardDocumentListIcon,
  HeartIcon,
  MapPinIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-store";
import { useWishlist } from "components/wishlist/wishlist-store";
import { addressesRepository } from "lib/addresses/addresses-repository";
import { ordersRepository } from "lib/orders/orders-repository";

export function DashboardOverview() {
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    ordersRepository.listByUser(user.id).then((orders) => setOrderCount(orders.length));
    addressesRepository.listByUser(user.id).then((addresses) => setAddressCount(addresses.length));
  }, [user]);

  if (!user) return null;

  const cards = [
    { label: "Pedidos", value: orderCount, href: "/cuenta/pedidos", icon: ClipboardDocumentListIcon },
    { label: "Direcciones", value: addressCount, href: "/cuenta/direcciones", icon: MapPinIcon },
    { label: "Favoritos", value: wishlistItems.length, href: "/favoritos", icon: HeartIcon },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center gap-3 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
          <UserIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-neutral-500">Hola,</p>
          <p className="font-medium">{user.name}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-neutral-200 p-5 transition-colors duration-200 hover:border-black dark:border-neutral-800 dark:hover:border-white"
            >
              <Icon className="h-5 w-5 text-neutral-500" />
              <p className="mt-3 text-2xl font-semibold">{card.value}</p>
              <p className="text-sm text-neutral-500">{card.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
