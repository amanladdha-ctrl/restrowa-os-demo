export function ownerNavItems(slug: string, restaurantId?: string) {
  const ownerPath = restaurantId ? `/owner?restaurantId=${restaurantId}` : "/owner";
  const menuPath = restaurantId
    ? `/owner/menu?restaurantId=${restaurantId}`
    : "/owner/menu";
  const ordersPath = restaurantId
    ? `/owner/orders?restaurantId=${restaurantId}`
    : "/owner/orders";
  const staffPath = restaurantId ? `/staff?restaurantId=${restaurantId}` : "/staff";
  const publicPath = restaurantId
    ? `/menu/${slug}?from=admin`
    : `/menu/${slug}`;

  return [
    ...(restaurantId ? [{ href: "/admin/restaurants", label: "Back to admin" }] : []),
    { href: ownerPath, label: "Dashboard" },
    { href: ordersPath, label: "Orders" },
    { href: menuPath, label: "Menu manager" },
    { href: staffPath, label: "Staff orders" },
    { href: `${ownerPath}#support-desk`, label: "Need help" },
    { href: "/account/security", label: "Security" },
    { href: publicPath, label: "Public menu" }
  ];
}
