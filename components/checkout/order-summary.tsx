import Image from "next/image";
import Link from "next/link";
import { Money } from "components/currency/money";

export type OrderSummaryLine = {
  id: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  priceValue: number;
  href?: string;
};

export function OrderSummary({ lines }: { lines: OrderSummaryLine[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {lines.map((line) => (
        <li key={line.id} className="flex gap-3">
          <div className="relative h-20 w-16 flex-none overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-900">
            <Image
              src={line.image}
              alt={line.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            {line.href ? (
              <Link href={line.href} className="text-sm hover:underline">
                {line.name}
              </Link>
            ) : (
              <p className="text-sm">{line.name}</p>
            )}
            <p className="text-xs text-neutral-500">
              Talla {line.size} · x{line.quantity}
            </p>
          </div>
          <span className="self-center text-sm font-medium">
            <Money amountCop={line.priceValue * line.quantity} />
          </span>
        </li>
      ))}
    </ul>
  );
}
