import { PrismaClient, UserRole, VegType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const demoPasswords = {
  superAdmin: "Admin@12345",
  owner: "Owner@12345",
  staff: "Staff@12345"
};

type DemoMenuItem = {
  name: string;
  price: number;
  vegType?: VegType;
  popular?: boolean;
  recommended?: boolean;
  imageUrl?: string;
  description?: string;
};

type DemoCategory = {
  name: string;
  items: DemoMenuItem[];
};

type DemoRestaurant = {
  name: string;
  slug: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  ownerName: string;
  ownerEmail: string;
  staffEmail?: string;
  themePrimary: string;
  themeAccent: string;
  themeBackground: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  minimumOrderAmount: number;
  upiId: string;
  categories: DemoCategory[];
};

const foodImages = {
  curry:
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641a?auto=format&fit=crop&w=500&q=80",
  paneer:
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80",
  dal:
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
  snack:
    "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=500&q=80",
  sandwich:
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80",
  fries:
    "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=500&q=80",
  coffee:
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=500&q=80",
  pizza:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
  pasta:
    "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?auto=format&fit=crop&w=500&q=80",
  dessert:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=500&q=80",
  noodles:
    "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=500&q=80",
  momos:
    "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=500&q=80",
  rice:
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80",
  lassi:
    "https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=500&q=80"
};

const demoRestaurants: DemoRestaurant[] = [
  {
    name: "Mewad Bites Demo Restaurant",
    slug: "mewad-bites",
    address: "Demo Address, Bhilwara, Rajasthan",
    phone: "+91 90000 00001",
    whatsappNumber: "+91 90000 00002",
    ownerName: "Mewad Bites Owner",
    ownerEmail: "owner@mewadbites.local",
    staffEmail: "staff@mewadbites.local",
    themePrimary: "#1f2933",
    themeAccent: "#e6902e",
    themeBackground: "#fff7ed",
    deliveryCharge: 30,
    freeDeliveryAbove: 499,
    minimumOrderAmount: 99,
    upiId: "mewad@upi",
    categories: [
      {
        name: "Rajasthani Specials",
        items: [
          {
            name: "Dal Baati Churma",
            price: 249,
            popular: true,
            recommended: true,
            imageUrl: foodImages.curry
          },
          { name: "Gatte Ki Sabzi", price: 189, imageUrl: foodImages.paneer },
          { name: "Ker Sangri", price: 219, imageUrl: foodImages.curry }
        ]
      },
      {
        name: "North Indian",
        items: [
          {
            name: "Paneer Butter Masala",
            price: 229,
            popular: true,
            imageUrl: foodImages.paneer
          },
          { name: "Dal Tadka", price: 159, imageUrl: foodImages.dal },
          { name: "Butter Roti", price: 25, imageUrl: foodImages.snack },
          { name: "Jeera Rice", price: 129, imageUrl: foodImages.rice }
        ]
      },
      {
        name: "Snacks",
        items: [
          { name: "Pyaaz Kachori", price: 45, popular: true, imageUrl: foodImages.snack },
          { name: "Masala Fries", price: 99, imageUrl: foodImages.fries },
          { name: "Veg Sandwich", price: 119, imageUrl: foodImages.sandwich }
        ]
      },
      {
        name: "Beverages",
        items: [
          { name: "Masala Chaas", price: 49, popular: true, imageUrl: foodImages.lassi },
          { name: "Sweet Lassi", price: 79, imageUrl: foodImages.lassi },
          { name: "Cold Coffee", price: 119, imageUrl: foodImages.coffee }
        ]
      }
    ]
  },
  {
    name: "Oldays Cafe",
    slug: "new-demo-olddays",
    address: "Demo Address, Rajasthan",
    phone: "+91 90000 00011",
    whatsappNumber: "+91 90000 00012",
    ownerName: "Oldays Cafe Owner",
    ownerEmail: "owner@oldays.local",
    staffEmail: "staff@oldays.local",
    themePrimary: "#0b7ee8",
    themeAccent: "#ff2f7d",
    themeBackground: "#f3f4f6",
    deliveryCharge: 35,
    freeDeliveryAbove: 599,
    minimumOrderAmount: 149,
    upiId: "oldays@upi",
    categories: [
      {
        name: "Cafe Snacks",
        items: [
          { name: "Crispy Bhindi", price: 149, popular: true, imageUrl: foodImages.snack },
          { name: "Loaded Masala Fries", price: 139, imageUrl: foodImages.fries },
          { name: "Cheese Garlic Bread", price: 159, imageUrl: foodImages.sandwich },
          { name: "Veg Club Sandwich", price: 179, recommended: true, imageUrl: foodImages.sandwich }
        ]
      },
      {
        name: "Pizza & Pasta",
        items: [
          { name: "Margherita Pizza", price: 249, popular: true, imageUrl: foodImages.pizza },
          { name: "Farmhouse Pizza", price: 329, imageUrl: foodImages.pizza },
          { name: "White Sauce Pasta", price: 239, imageUrl: foodImages.pasta },
          { name: "Arrabbiata Pasta", price: 229, imageUrl: foodImages.pasta }
        ]
      },
      {
        name: "Indian Bowls",
        items: [
          { name: "Paneer Rice Bowl", price: 219, imageUrl: foodImages.paneer },
          { name: "Dal Makhani Rice Bowl", price: 199, imageUrl: foodImages.dal },
          { name: "Rajma Rice Bowl", price: 189, imageUrl: foodImages.rice }
        ]
      },
      {
        name: "Drinks & Desserts",
        items: [
          { name: "Cold Coffee", price: 139, popular: true, imageUrl: foodImages.coffee },
          { name: "Classic Lemon Iced Tea", price: 119, imageUrl: foodImages.coffee },
          { name: "Chocolate Brownie", price: 149, imageUrl: foodImages.dessert }
        ]
      }
    ]
  },
  {
    name: "Bella Roma Italian Kitchen",
    slug: "bella-roma",
    address: "Demo High Street, Jaipur, Rajasthan",
    phone: "+91 90000 00021",
    whatsappNumber: "+91 90000 00022",
    ownerName: "Bella Roma Owner",
    ownerEmail: "owner@bellaroma.local",
    staffEmail: "staff@bellaroma.local",
    themePrimary: "#173b2f",
    themeAccent: "#d6452f",
    themeBackground: "#fff8ef",
    deliveryCharge: 45,
    freeDeliveryAbove: 799,
    minimumOrderAmount: 249,
    upiId: "bellaroma@upi",
    categories: [
      {
        name: "Wood Fired Pizza",
        items: [
          { name: "Margherita Classica", price: 349, popular: true, imageUrl: foodImages.pizza },
          { name: "Farmhouse Verdure Pizza", price: 429, imageUrl: foodImages.pizza },
          { name: "Spicy Paneer Pizza", price: 449, recommended: true, imageUrl: foodImages.pizza },
          { name: "Four Cheese Pizza", price: 499, imageUrl: foodImages.pizza }
        ]
      },
      {
        name: "Pasta",
        items: [
          { name: "Penne Arrabbiata", price: 329, popular: true, imageUrl: foodImages.pasta },
          { name: "Alfredo Pasta", price: 359, imageUrl: foodImages.pasta },
          { name: "Pesto Spaghetti", price: 389, imageUrl: foodImages.pasta },
          { name: "Lasagna Al Forno", price: 449, imageUrl: foodImages.pasta }
        ]
      },
      {
        name: "Sides & Desserts",
        items: [
          { name: "Bruschetta", price: 229, imageUrl: foodImages.sandwich },
          { name: "Garlic Bread", price: 179, imageUrl: foodImages.sandwich },
          { name: "Tiramisu Cup", price: 249, imageUrl: foodImages.dessert },
          { name: "Chocolate Lava Cake", price: 229, imageUrl: foodImages.dessert }
        ]
      }
    ]
  },
  {
    name: "Dragon Wok Chinese",
    slug: "dragon-wok",
    address: "Demo Food Street, Udaipur, Rajasthan",
    phone: "+91 90000 00031",
    whatsappNumber: "+91 90000 00032",
    ownerName: "Dragon Wok Owner",
    ownerEmail: "owner@dragonwok.local",
    staffEmail: "staff@dragonwok.local",
    themePrimary: "#4a0f0f",
    themeAccent: "#f5b301",
    themeBackground: "#fff3e6",
    deliveryCharge: 40,
    freeDeliveryAbove: 699,
    minimumOrderAmount: 199,
    upiId: "dragonwok@upi",
    categories: [
      {
        name: "Starters",
        items: [
          { name: "Veg Spring Rolls", price: 179, imageUrl: foodImages.snack },
          { name: "Chilli Paneer Dry", price: 249, popular: true, imageUrl: foodImages.paneer },
          { name: "Crispy Corn Pepper Salt", price: 219, imageUrl: foodImages.snack },
          { name: "Steamed Veg Momos", price: 159, recommended: true, imageUrl: foodImages.momos }
        ]
      },
      {
        name: "Noodles & Rice",
        items: [
          { name: "Hakka Noodles", price: 199, popular: true, imageUrl: foodImages.noodles },
          { name: "Schezwan Noodles", price: 219, imageUrl: foodImages.noodles },
          { name: "Veg Fried Rice", price: 189, imageUrl: foodImages.rice },
          { name: "Burnt Garlic Fried Rice", price: 229, imageUrl: foodImages.rice }
        ]
      },
      {
        name: "Main Course",
        items: [
          { name: "Manchurian Gravy", price: 239, imageUrl: foodImages.curry },
          { name: "Hot Garlic Paneer", price: 269, imageUrl: foodImages.paneer },
          { name: "Thai Green Curry", price: 299, imageUrl: foodImages.curry },
          { name: "Chilli Garlic Noodles Combo", price: 329, imageUrl: foodImages.noodles }
        ]
      }
    ]
  }
];

async function upsertMenu(
  restaurantId: string,
  categories: DemoCategory[],
  descriptionPrefix: string
) {
  for (const [categoryIndex, categorySeed] of categories.entries()) {
    const category = await prisma.menuCategory.upsert({
      where: {
        restaurantId_name: {
          restaurantId,
          name: categorySeed.name
        }
      },
      update: {
        active: true,
        sortOrder: categoryIndex
      },
      create: {
        restaurantId,
        name: categorySeed.name,
        active: true,
        sortOrder: categoryIndex
      }
    });

    for (const [itemIndex, item] of categorySeed.items.entries()) {
      await prisma.menuItem.upsert({
        where: {
          restaurantId_name: {
            restaurantId,
            name: item.name
          }
        },
        update: {
          categoryId: category.id,
          price: item.price,
          imageUrl: item.imageUrl,
          vegType: item.vegType ?? "veg",
          popular: item.popular ?? false,
          recommended: item.recommended ?? itemIndex === 0,
          available: true,
          description:
            item.description ?? `${descriptionPrefix} demo item for menu testing.`,
          sortOrder: itemIndex
        },
        create: {
          restaurantId,
          categoryId: category.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          vegType: item.vegType ?? "veg",
          popular: item.popular ?? false,
          recommended: item.recommended ?? itemIndex === 0,
          available: true,
          description:
            item.description ?? `${descriptionPrefix} demo item for menu testing.`,
          sortOrder: itemIndex
        }
      });
    }
  }
}

async function main() {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 30);

  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { name: "Starter" },
    update: { monthlyPrice: 999, setupFee: 4999 },
    create: {
      name: "Starter",
      setupFee: 4999,
      monthlyPrice: 999,
      features: [
        "WhatsApp/QR ordering demo",
        "Basic menu",
        "COD and mock UPI QR",
        "Owner and staff dashboard"
      ]
    }
  });

  const [superHash, ownerHash, staffHash] = await Promise.all([
    bcrypt.hash(demoPasswords.superAdmin, 12),
    bcrypt.hash(demoPasswords.owner, 12),
    bcrypt.hash(demoPasswords.staff, 12)
  ]);

  await prisma.user.upsert({
    where: { email: "admin@restrowa.local" },
    update: { name: "Aman Super Admin", role: UserRole.SUPER_ADMIN },
    create: {
      email: "admin@restrowa.local",
      name: "Aman Super Admin",
      passwordHash: superHash,
      role: UserRole.SUPER_ADMIN
    }
  });

  for (const demo of demoRestaurants) {
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: demo.slug },
      update: {
        name: demo.name,
        address: demo.address,
        phone: demo.phone,
        whatsappNumber: demo.whatsappNumber,
        logoUrl: null,
        themePrimary: demo.themePrimary,
        themeAccent: demo.themeAccent,
        themeBackground: demo.themeBackground,
        openingTime: "10:00",
        closingTime: "22:30",
        status: "active",
        gracePeriodDays: 5,
        planType: "Starter",
        subscriptionAmount: 999,
        paymentDueAmount: 0,
        perOrderFeeEnabled: true,
        perOrderFeeAmount: 5,
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        deliveryCharge: demo.deliveryCharge,
        freeDeliveryAbove: demo.freeDeliveryAbove,
        minimumOrderAmount: demo.minimumOrderAmount,
        codEnabled: true,
        upiQrEnabled: true,
        upiId: demo.upiId,
        paymentInstructions: "This is a mock UPI flow for MVP demo only."
      },
      create: {
        name: demo.name,
        slug: demo.slug,
        address: demo.address,
        phone: demo.phone,
        whatsappNumber: demo.whatsappNumber,
        themePrimary: demo.themePrimary,
        themeAccent: demo.themeAccent,
        themeBackground: demo.themeBackground,
        openingTime: "10:00",
        closingTime: "22:30",
        status: "active",
        trialStartDate: now,
        trialEndDate: trialEnd,
        gracePeriodDays: 5,
        planType: "Starter",
        subscriptionAmount: 999,
        paymentDueAmount: 0,
        perOrderFeeEnabled: true,
        perOrderFeeAmount: 5,
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        deliveryCharge: demo.deliveryCharge,
        freeDeliveryAbove: demo.freeDeliveryAbove,
        minimumOrderAmount: demo.minimumOrderAmount,
        deliveryRadiusText: "Demo delivery radius for validation.",
        codEnabled: true,
        upiQrEnabled: true,
        upiId: demo.upiId,
        paymentInstructions: "This is a mock UPI flow for MVP demo only."
      }
    });

    await prisma.restaurantSubscription.upsert({
      where: { restaurantId: restaurant.id },
      update: {
        planId: starterPlan.id,
        status: "active",
        amountDue: 0
      },
      create: {
        restaurantId: restaurant.id,
        planId: starterPlan.id,
        status: "active",
        startDate: now,
        endDate: trialEnd,
        amountDue: 0
      }
    });

    await prisma.user.upsert({
      where: { email: demo.ownerEmail },
      update: {
        name: demo.ownerName,
        role: UserRole.RESTAURANT_OWNER,
        restaurantId: restaurant.id
      },
      create: {
        email: demo.ownerEmail,
        name: demo.ownerName,
        passwordHash: ownerHash,
        role: UserRole.RESTAURANT_OWNER,
        restaurantId: restaurant.id
      }
    });

    if (demo.slug === "new-demo-olddays") {
      await prisma.user.updateMany({
        where: { email: "owner-new@restrowa.local" },
        data: {
          name: "Oldays Cafe Owner",
          role: UserRole.RESTAURANT_OWNER,
          restaurantId: restaurant.id
        }
      });
    }

    if (demo.staffEmail) {
      const staff = await prisma.user.upsert({
        where: { email: demo.staffEmail },
        update: {
          name: `${demo.name} Staff`,
          role: UserRole.RESTAURANT_STAFF,
          restaurantId: restaurant.id
        },
        create: {
          email: demo.staffEmail,
          name: `${demo.name} Staff`,
          passwordHash: staffHash,
          role: UserRole.RESTAURANT_STAFF,
          restaurantId: restaurant.id
        }
      });

      await prisma.restaurantStaff.upsert({
        where: { userId: staff.id },
        update: {
          restaurantId: restaurant.id,
          role: "kitchen",
          active: true
        },
        create: {
          userId: staff.id,
          restaurantId: restaurant.id,
          role: "kitchen"
        }
      });
    }

    await upsertMenu(restaurant.id, demo.categories, demo.name);

    const couponStart = new Date(now);
    const couponEnd = new Date(now);
    couponEnd.setDate(couponEnd.getDate() + 60);

    await prisma.coupon.upsert({
      where: {
        restaurantId_code: {
          restaurantId: restaurant.id,
          code: "DEMO10"
        }
      },
      update: {
        active: true,
        endDate: couponEnd
      },
      create: {
        restaurantId: restaurant.id,
        code: "DEMO10",
        discountType: "percentage",
        discountValue: 10,
        minimumOrderAmount: 199,
        maxDiscount: 80,
        startDate: couponStart,
        endDate: couponEnd,
        active: true
      }
    });

    await prisma.auditLog.create({
      data: {
        restaurantId: restaurant.id,
        action: "seed_demo_restaurant",
        entityType: "restaurant",
        entityId: restaurant.id,
        metadata: {
          phase: "Phase 3",
          note: "Demo restaurant and menu seeded for RestroWA OS."
        }
      }
    });
  }

  console.log("Seed completed.");
  console.log("Super admin: admin@restrowa.local / Admin@12345");
  console.log("Mewad owner: owner@mewadbites.local / Owner@12345");
  console.log("Oldays owner: owner@oldays.local / Owner@12345");
  console.log("Bella Roma owner: owner@bellaroma.local / Owner@12345");
  console.log("Dragon Wok owner: owner@dragonwok.local / Owner@12345");
  console.log("Mewad staff: staff@mewadbites.local / Staff@12345");
  console.log("Oldays staff: staff@oldays.local / Staff@12345");
  console.log("Bella Roma staff: staff@bellaroma.local / Staff@12345");
  console.log("Dragon Wok staff: staff@dragonwok.local / Staff@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
