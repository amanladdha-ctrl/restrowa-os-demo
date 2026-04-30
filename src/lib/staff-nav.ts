export function staffNavItems(
  slug: string,
  options?: { restaurantId?: string; showOwnerLink?: boolean }
) {
  const restaurantId = options?.restaurantId;
  const staffPath = restaurantId ? `/staff?restaurantId=${restaurantId}` : "/staff";
  const publicPath = restaurantId ? `/menu/${slug}?from=admin` : `/menu/${slug}`;

  return [
    ...(restaurantId ? [{ href: "/admin/restaurants", label: "Back to admin" }] : []),
    { href: staffPath, label: "Live orders" },
    ...(options?.showOwnerLink ? [{ href: restaurantId ? `/owner?restaurantId=${restaurantId}` : "/owner", label: "Owner dashboard" }] : []),
    { href: `${staffPath}#support-desk`, label: "Need help" },
    { href: "/account/security", label: "Security" },
    { href: publicPath, label: "Public menu" }
  ];
}
