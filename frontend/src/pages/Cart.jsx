import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  ShoppingBag,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  clearCart,
  getCart,
  removeFromCart,
} from "../services/cart";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getImageUrl,
} from "../utils/imageUrl";

import "../styles/Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  const [items, setItems] =
    useState(() => getCart());

  const [message, setMessage] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] = useState("");

  /*
   * Keep this page synchronized when
   * another component changes the cart.
   */
  useEffect(() => {
    const handleCartUpdated = () => {
      setItems(getCart());
    };

    window.addEventListener(
      "cart-updated",
      handleCartUpdated
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdated
      );
    };
  }, []);

  /*
   * Reload the cart whenever the user
   * returns to this page.
   */
  useEffect(() => {
    setItems(getCart());
  }, [location.pathname]);

  /*
   * Original artworks count as one item.
   * Editions may support larger quantities.
   */
  const totalQuantity =
    useMemo(() => {
      return items.reduce(
        (total, item) => {
          if (
            item.product_type ===
            "edition"
          ) {
            const quantity =
              Number(
                item.quantity || 1
              );

            return (
              total +
              (Number.isFinite(quantity)
                ? Math.max(
                    1,
                    Math.floor(quantity)
                  )
                : 1)
            );
          }

          return total + 1;
        },
        0
      );
    }, [items]);

  /*
   * This subtotal is only displayed
   * in the frontend.
   *
   * The backend must calculate the
   * trusted price during checkout.
   */
  const subtotal =
    useMemo(() => {
      return items.reduce(
        (total, item) => {
          const price =
            Number(item.price || 0);

          const safePrice =
            Number.isFinite(price)
              ? price
              : 0;

          const quantity =
            item.product_type ===
            "edition"
              ? Math.max(
                  1,
                  Number(
                    item.quantity || 1
                  )
                )
              : 1;

          return (
            total +
            safePrice * quantity
          );
        },
        0
      );
    }, [items]);

  const deliveryCharge = 0;

  const total =
    subtotal + deliveryCharge;

  const formatCurrency = (
    value
  ) => {
    const amount =
      Number(value || 0);

    if (!Number.isFinite(amount)) {
      return "0";
    }

    return amount.toLocaleString(
      "en-IN"
    );
  };

  const getArtistName = (
    item
  ) => {
    return (
      item.artist?.name ||
      item.artist?.full_name ||
      item.artist_name ||
      item.user?.name ||
      item.creator_name ||
      "ArtVault Artist"
    );
  };

  const getItemImage = (
    item
  ) => {
    const rawImage =
      item.image_url ||
      item.image ||
      item.thumbnail_url ||
      item.cover_image ||
      item.images?.[0]?.image_url ||
      item.images?.[0]?.url ||
      "";

    return rawImage
      ? getImageUrl(rawImage)
      : "";
  };

  const clearStatusMessage =
    () => {
      setMessage("");
      setMessageType("");
    };

  const showMessage = (
    text,
    type = "error"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const handleRemoveItem = (
    item
  ) => {
    const updatedItems =
      removeFromCart(
        item.id,
        item.product_type ||
          "artwork"
      );

    setItems(updatedItems);

    showMessage(
      "Artwork removed from your cart.",
      "success"
    );
  };

  const handleClearCart = () => {
    const confirmed =
      window.confirm(
        "Remove every item from your cart?"
      );

    if (!confirmed) {
      return;
    }

    clearCart();
    setItems([]);

    showMessage(
      "Your cart has been cleared.",
      "success"
    );
  };

  /*
   * Cart should only navigate to the
   * checkout page.
   *
   * The order must not be created here.
   */
  const handleCheckout = () => {
    clearStatusMessage();

    if (!user) {
      navigate("/login", {
        state: {
          from: "/cart",
        },
      });

      return;
    }

    if (items.length === 0) {
      showMessage(
        "Your cart is empty."
      );

      return;
    }

    const invalidItems =
      items.filter(
        (item) =>
          !item.id ||
          !item.title
      );

    if (
      invalidItems.length > 0
    ) {
      showMessage(
        "Some cart items are invalid. Please remove them and add them again."
      );

      return;
    }

    navigate("/checkout");
  };

  return (
    <>
      <section className="av-cart-hero">
        <div className="av-cart-hero-inner">
          <p className="av-cart-hero-eyebrow">
            YOUR SELECTION
          </p>

          <div className="av-cart-hero-row">
            <div>
              <h1>
                Shopping cart
              </h1>

              <p>
                Review your selected
                artworks before
                continuing to checkout.
              </p>
            </div>

            {items.length > 0 && (
              <div className="av-cart-hero-count">
                <ShoppingBag
                  size={18}
                  aria-hidden="true"
                />

                <span>
                  {totalQuantity}

                  {totalQuantity === 1
                    ? " item"
                    : " items"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="av-cart-page">
        <div className="av-cart-glow av-cart-glow-left" />

        <div className="av-cart-glow av-cart-glow-right" />

        <section className="av-cart-container">
          {items.length === 0 ? (
            <div className="av-cart-empty">
              <div className="av-cart-empty-icon">
                <ShoppingBag
                  size={42}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>

              <p className="av-cart-eyebrow">
                YOUR ARTVAULT CART
              </p>

              <h1>
                Your cart is waiting
                for something special.
              </h1>

              <p className="av-cart-empty-description">
                Discover original
                artworks and collect a
                piece that belongs in
                your personal space.
              </p>

              {message && (
                <div
                  className={`av-cart-message av-cart-message-${messageType}`}
                  role={
                    messageType ===
                    "success"
                      ? "status"
                      : "alert"
                  }
                >
                  {messageType ===
                  "success" ? (
                    <CheckCircle2
                      size={18}
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      size={18}
                      aria-hidden="true"
                    />
                  )}

                  <span>
                    {message}
                  </span>
                </div>
              )}

              <Link
                to="/explore"
                className="av-cart-explore-button"
              >
                Explore artworks
              </Link>
            </div>
          ) : (
            <div className="av-cart-content">
              <section
                className="av-cart-items-panel"
                aria-label="Shopping cart items"
              >
                <div className="av-cart-panel-header">
                  <div>
                    <p>
                      YOUR SELECTION
                    </p>

                    <h2>
                      Cart items
                    </h2>
                  </div>

                  <div className="av-cart-panel-actions">
                    <span>
                      {items.length}

                      {items.length === 1
                        ? " artwork"
                        : " artworks"}
                    </span>

                    <button
                      type="button"
                      className="av-cart-clear-button"
                      onClick={
                        handleClearCart
                      }
                    >
                      Clear cart
                    </button>
                  </div>
                </div>

                <div className="av-cart-items-list">
                  {items.map(
                    (item) => {
                      const imageUrl =
                        getItemImage(
                          item
                        );

                      const price =
                        Number(
                          item.price || 0
                        );

                      const safePrice =
                        Number.isFinite(
                          price
                        )
                          ? price
                          : 0;

                      const quantity =
                        item.product_type ===
                        "edition"
                          ? Math.max(
                              1,
                              Number(
                                item.quantity ||
                                  1
                              )
                            )
                          : 1;

                      const itemTotal =
                        safePrice *
                        quantity;

                      const productType =
                        item.product_type ||
                        "artwork";

                      return (
                        <article
                          className="av-cart-item"
                          key={`${item.id}-${productType}`}
                        >
                          <Link
                            to={`/artworks/${item.id}`}
                            className="av-cart-item-image-link"
                            aria-label={`View ${item.title || "artwork"}`}
                          >
                            {imageUrl ? (
                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  item.title ||
                                  "Artwork"
                                }
                                className="av-cart-item-image"
                              />
                            ) : (
                              <div className="av-cart-image-placeholder">
                                <ImageOff
                                  size={29}
                                  aria-hidden="true"
                                />

                                <span>
                                  Image
                                  unavailable
                                </span>
                              </div>
                            )}
                          </Link>

                          <div className="av-cart-item-info">
                            <div className="av-cart-item-main">
                              <div className="av-cart-item-copy">
                                <p className="av-cart-item-type">
                                  {productType ===
                                  "edition"
                                    ? "Limited edition"
                                    : "Original artwork"}
                                </p>

                                <Link
                                  to={`/artworks/${item.id}`}
                                  className="av-cart-item-title"
                                >
                                  {item.title ||
                                    "Untitled Artwork"}
                                </Link>

                                <p className="av-cart-item-artist">
                                  by{" "}

                                  <span>
                                    {getArtistName(
                                      item
                                    )}
                                  </span>
                                </p>
                              </div>

                              <button
                                type="button"
                                className="av-cart-remove-button"
                                onClick={() =>
                                  handleRemoveItem(
                                    item
                                  )
                                }
                                aria-label={`Remove ${item.title || "artwork"} from cart`}
                              >
                                <Trash2
                                  size={18}
                                  aria-hidden="true"
                                />
                              </button>
                            </div>

                            <div className="av-cart-item-footer">
                              <div className="av-cart-quantity">
                                <span>
                                  Quantity
                                </span>

                                <strong>
                                  {productType ===
                                  "edition"
                                    ? quantity
                                    : "1 original"}
                                </strong>
                              </div>

                              <div className="av-cart-item-price">
                                {productType ===
                                  "edition" &&
                                  quantity > 1 && (
                                    <span>
                                      ₹
                                      {formatCurrency(
                                        safePrice
                                      )}{" "}
                                      each
                                    </span>
                                  )}

                                <strong>
                                  ₹
                                  {formatCurrency(
                                    itemTotal
                                  )}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>

                <Link
                  to="/explore"
                  className="av-cart-continue-link"
                >
                  <ArrowLeft
                    size={17}
                    aria-hidden="true"
                  />

                  Continue exploring
                </Link>
              </section>

              <aside className="av-cart-summary">
                <div className="av-cart-summary-heading">
                  <p>
                    PURCHASE DETAILS
                  </p>

                  <h2>
                    Order summary
                  </h2>
                </div>

                <div className="av-cart-summary-lines">
                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      ₹
                      {formatCurrency(
                        subtotal
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Delivery
                    </span>

                    <strong className="av-cart-free">
                      Free
                    </strong>
                  </div>
                </div>

                <div className="av-cart-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    ₹
                    {formatCurrency(
                      total
                    )}
                  </strong>
                </div>

                {message && (
                  <div
                    className={`av-cart-message av-cart-message-${messageType}`}
                    role={
                      messageType ===
                      "success"
                        ? "status"
                        : "alert"
                    }
                  >
                    {messageType ===
                    "success" ? (
                      <CheckCircle2
                        size={18}
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        size={18}
                        aria-hidden="true"
                      />
                    )}

                    <span>
                      {message}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  className="av-cart-checkout-button"
                  onClick={
                    handleCheckout
                  }
                >
                  <ShoppingBag
                    size={18}
                    aria-hidden="true"
                  />

                  Proceed to checkout
                </button>

                <p className="av-cart-secure-note">
                  Prices and artwork
                  availability will be
                  verified securely
                  before your order is
                  created.
                </p>
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  );
}