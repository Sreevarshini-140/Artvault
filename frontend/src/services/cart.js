const CART_KEY = "artvault_cart";

function normalizeItem(item) {
  return {
    ...item,
    product_type:
      item.product_type || "artwork",

    quantity:
      item.product_type === "edition"
        ? Math.max(
            1,
            Number(item.quantity || 1)
          )
        : 1,
  };
}

export function getCart() {
  try {
    const storedCart =
      localStorage.getItem(CART_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart =
      JSON.parse(storedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.map(
      normalizeItem
    );
  } catch (error) {
    console.error(
      "Failed to read cart:",
      error
    );

    return [];
  }
}

export function saveCart(items) {
  const safeItems =
    Array.isArray(items)
      ? items.map(normalizeItem)
      : [];

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(safeItems)
  );

  window.dispatchEvent(
    new Event("cart-updated")
  );

  return safeItems;
}

export function addToCart(item) {
  if (!item?.id) {
    throw new Error(
      "A valid artwork is required."
    );
  }

  const items = getCart();

  const productType =
    item.product_type || "artwork";

  const existingItem =
    items.find(
      (cartItem) =>
        Number(cartItem.id) ===
          Number(item.id) &&
        (cartItem.product_type ||
          "artwork") === productType
    );

  /*
   * An original artwork can only
   * exist once in the cart.
   */
  if (existingItem) {
    return {
      items,
      added: false,
      message:
        "This artwork is already in your cart.",
    };
  }

  const updatedItems = [
    ...items,
    normalizeItem({
      ...item,
      product_type: productType,
      quantity: 1,
    }),
  ];

  saveCart(updatedItems);

  return {
    items: updatedItems,
    added: true,
    message:
      "Artwork added to your cart.",
  };
}

export function removeFromCart(
  id,
  productType = "artwork"
) {
  const updatedItems =
    getCart().filter(
      (item) =>
        !(
          Number(item.id) ===
            Number(id) &&
          (item.product_type ||
            "artwork") ===
            productType
        )
    );

  saveCart(updatedItems);

  return updatedItems;
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  return getCart().reduce(
    (total, item) => {
      if (
        item.product_type ===
        "edition"
      ) {
        return (
          total +
          Math.max(
            1,
            Number(item.quantity || 1)
          )
        );
      }

      return total + 1;
    },
    0
  );
}

export function isInCart(
  id,
  productType = "artwork"
) {
  return getCart().some(
    (item) =>
      Number(item.id) ===
        Number(id) &&
      (item.product_type ||
        "artwork") ===
        productType
  );
}