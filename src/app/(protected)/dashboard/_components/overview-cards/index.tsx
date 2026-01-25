import { compactFormat } from "@/lib/format-number";
import { getOverviewData } from "../../fetch";
import { OverviewCard } from "./card";
import * as icons from "./icons";

export async function OverviewCardsGroup() {
  const { views, profit, products, users } = await getOverviewData();

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Total Ventas"
        data={{
          ...views,
          value: "$" + compactFormat(views.value),
        }}
        Icon={icons.Profit}
      />

      <OverviewCard
        label="Pedidos Totales"
        data={{
          ...profit,
          value: compactFormat(profit.value),
        }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Clientes"
        data={{
          ...products,
          value: compactFormat(products.value),
        }}
        Icon={icons.Users}
      />

      <OverviewCard
        label="Cajas Totales"
        data={{
          ...users,
          value: compactFormat(users.value),
        }}
        Icon={icons.Product}
      />
    </div>
  );
}
