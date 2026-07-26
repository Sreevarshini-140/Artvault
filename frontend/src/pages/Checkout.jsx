import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ImageOff,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  clearCart,
  getCart,
} from "../services/cart";

import {
  useAuth,
} from "../context/AuthContext";

import api from "../services/api";

import {
  getImageUrl,
} from "../utils/imageUrl";

import "../styles/Checkout.css";

const INITIAL_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function Checkout() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [items, setItems] =
    useState(() => getCart());

  const [
    address,
    setAddress,
  ] = useState(
    INITIAL_ADDRESS
  );

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("mock");

  const [
    acceptingTerms,
    setAcceptingTerms,
  ] = useState(false);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] = useState("");

  useEffect(() => {
    const currentCart =
      getCart();

    setItems(currentCart);

    if (
      currentCart.length === 0
    ) {
      navigate("/cart", {
        replace: true,
      });
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setAddress(
      (currentAddress) => ({
        ...currentAddress,

        fullName:
          currentAddress.fullName ||
          user.full_name ||
          user.name ||
          "",

        phone:
          currentAddress.phone ||
          user.phone ||
          "",
      })
    );
  }, [user]);

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (total, item) => {
          const price =
            Number(
              item.price || 0
            );

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

  const discount = 0;

  const total =
    subtotal +
    deliveryCharge -
    discount;

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

  const clearMessage = () => {
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

  const handleAddressChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setAddress(
      (currentAddress) => ({
        ...currentAddress,
        [name]: value,
      })
    );

    clearMessage();
  };

  const validateCheckout = () => {
    if (!user) {
      navigate("/login", {
        state: {
          from: "/checkout",
        },
      });

      return false;
    }

    if (items.length === 0) {
      showMessage(
        "Your cart is empty."
      );

      return false;
    }

    if (
      !address.fullName.trim()
    ) {
      showMessage(
        "Please enter your full name."
      );

      return false;
    }

    const phoneDigits =
      address.phone.replace(
        /\D/g,
        ""
      );

    if (
      phoneDigits.length !== 10
    ) {
      showMessage(
        "Please enter a valid 10-digit mobile number."
      );

      return false;
    }

    if (
      !address.addressLine1.trim()
    ) {
      showMessage(
        "Please enter your house number and street address."
      );

      return false;
    }

    if (!address.city.trim()) {
      showMessage(
        "Please enter your city."
      );

      return false;
    }

    if (!address.state.trim()) {
      showMessage(
        "Please enter your state."
      );

      return false;
    }

    if (
      !/^\d{6}$/.test(
        address.postalCode.trim()
      )
    ) {
      showMessage(
        "Please enter a valid 6-digit PIN code."
      );

      return false;
    }

    if (
      !address.country.trim()
    ) {
      showMessage(
        "Please enter your country."
      );

      return false;
    }

    if (!paymentMethod) {
      showMessage(
        "Please select a payment method."
      );

      return false;
    }

    if (!acceptingTerms) {
      showMessage(
        "Please confirm the order details before placing your order."
      );

      return false;
    }

    return true;
  };

  const buildShippingAddress =
    () => {
      return [
        address.fullName.trim(),

        `Phone: ${address.phone.trim()}`,

        address.addressLine1.trim(),

        address.addressLine2.trim(),

        address.city.trim(),

        `${address.state.trim()} - ${address.postalCode.trim()}`,

        address.country.trim(),
      ]
        .filter(Boolean)
        .join(", ");
    };

  const handlePlaceOrder =
    async () => {
      clearMessage();

      const isValid =
        validateCheckout();

      if (!isValid) {
        return;
      }

      try {
        setProcessing(true);

        const orderItems =
          items.map((item) => ({
            artwork_id:
              item.id,

            product_type:
              item.product_type ||
              "artwork",

            quantity:
              item.product_type ===
              "edition"
                ? Math.max(
                    1,
                    Number(
                      item.quantity ||
                        1
                    )
                  )
                : 1,
          }));

        const response =
          await api.post(
            "/orders",
            {
              shipping_address:
                buildShippingAddress(),

              payment_method:
                paymentMethod,

              items:
                orderItems,
            }
          );

        const responseData =
          response.data || {};

        const order =
          responseData.order ||
          responseData;

        const orderId =
          order.id ||
          responseData.order_id;

        clearCart();
        setItems([]);

        showMessage(
          "Your order has been placed successfully.",
          "success"
        );

        window.setTimeout(() => {
  navigate("/orders", {
    replace: true,
  });
}, 800);
      } catch (error) {
        console.error(
          "Order creation failed:",
          error
        );

        showMessage(
          error.message ||
            "Unable to place your order. Please try again."
        );
      } finally {
        setProcessing(false);
      }
    };

  return (
    <>
      <section className="av-checkout-hero">
        <div className="av-checkout-hero-inner">
          <p className="av-checkout-eyebrow">
            SECURE CHECKOUT
          </p>

          <div className="av-checkout-hero-row">
            <div>
              <h1>
                Complete your purchase
              </h1>

              <p>
                Enter your delivery
                details and review your
                selected artworks.
              </p>
            </div>

            <div className="av-checkout-secure-badge">
              <LockKeyhole
                size={18}
                aria-hidden="true"
              />

              Secure checkout
            </div>
          </div>
        </div>
      </section>

      <main className="av-checkout-page">
        <div className="av-checkout-glow av-checkout-glow-left" />

        <div className="av-checkout-glow av-checkout-glow-right" />

        <div className="av-checkout-container">
          <Link
            to="/cart"
            className="av-checkout-back"
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />

            Return to cart
          </Link>

          <div className="av-checkout-layout">
            <div className="av-checkout-main">
              <section className="av-checkout-card">
                <div className="av-checkout-card-heading">
                  <div className="av-checkout-heading-icon">
                    <MapPin
                      size={20}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p>
                      DELIVERY DETAILS
                    </p>

                    <h2>
                      Shipping address
                    </h2>
                  </div>
                </div>

                <div className="av-checkout-form">
                  <div className="av-checkout-field av-checkout-field-full">
                    <label htmlFor="fullName">
                      Full name
                    </label>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={
                        address.fullName
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="av-checkout-field av-checkout-field-full">
                    <label htmlFor="phone">
                      Mobile number
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={
                        address.phone
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="av-checkout-field av-checkout-field-full">
                    <label htmlFor="addressLine1">
                      House number and
                      street
                    </label>

                    <input
                      id="addressLine1"
                      name="addressLine1"
                      type="text"
                      autoComplete="address-line1"
                      value={
                        address.addressLine1
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="House number, building and street"
                    />
                  </div>

                  <div className="av-checkout-field av-checkout-field-full">
                    <label htmlFor="addressLine2">
                      Landmark or area
                      <span>
                        Optional
                      </span>
                    </label>

                    <input
                      id="addressLine2"
                      name="addressLine2"
                      type="text"
                      autoComplete="address-line2"
                      value={
                        address.addressLine2
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Area, landmark or locality"
                    />
                  </div>

                  <div className="av-checkout-field">
                    <label htmlFor="city">
                      City
                    </label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={
                        address.city
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="City"
                    />
                  </div>

                  <div className="av-checkout-field">
                    <label htmlFor="state">
                      State
                    </label>

                    <input
                      id="state"
                      name="state"
                      type="text"
                      autoComplete="address-level1"
                      value={
                        address.state
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="State"
                    />
                  </div>

                  <div className="av-checkout-field">
                    <label htmlFor="postalCode">
                      PIN code
                    </label>

                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      autoComplete="postal-code"
                      value={
                        address.postalCode
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="6-digit PIN"
                      maxLength="6"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="av-checkout-field">
                    <label htmlFor="country">
                      Country
                    </label>

                    <input
                      id="country"
                      name="country"
                      type="text"
                      autoComplete="country-name"
                      value={
                        address.country
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Country"
                    />
                  </div>
                </div>
              </section>

              <section className="av-checkout-card">
                <div className="av-checkout-card-heading">
                  <div className="av-checkout-heading-icon">
                    <WalletCards
                      size={20}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p>
                      PAYMENT
                    </p>

                    <h2>
                      Payment method
                    </h2>
                  </div>
                </div>

                <div className="av-checkout-payment-options">
                  <label
                    className={`av-checkout-payment-option ${
                      paymentMethod ===
                      "mock"
                        ? "av-checkout-payment-option-active"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mock"
                      checked={
                        paymentMethod ===
                        "mock"
                      }
                      onChange={(
                        event
                      ) => {
                        setPaymentMethod(
                          event.target
                            .value
                        );

                        clearMessage();
                      }}
                    />

                    <span className="av-checkout-payment-icon">
                      <CreditCard
                        size={22}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="av-checkout-payment-copy">
                      <strong>
                        Mock online
                        payment
                      </strong>

                      <small>
                        Safely test the
                        complete payment
                        and order flow.
                      </small>
                    </span>

                    <span className="av-checkout-radio-mark" />
                  </label>

                  <label
                    className={`av-checkout-payment-option ${
                      paymentMethod ===
                      "cod"
                        ? "av-checkout-payment-option-active"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={
                        paymentMethod ===
                        "cod"
                      }
                      onChange={(
                        event
                      ) => {
                        setPaymentMethod(
                          event.target
                            .value
                        );

                        clearMessage();
                      }}
                    />

                    <span className="av-checkout-payment-icon">
                      <PackageCheck
                        size={22}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="av-checkout-payment-copy">
                      <strong>
                        Cash on delivery
                      </strong>

                      <small>
                        Pay when the
                        artwork reaches
                        your address.
                      </small>
                    </span>

                    <span className="av-checkout-radio-mark" />
                  </label>
                </div>

                <div className="av-checkout-payment-note">
                  <ShieldCheck
                    size={18}
                    aria-hidden="true"
                  />

                  <p>
                    Razorpay can be
                    integrated after the
                    mock-payment workflow
                    is fully tested.
                  </p>
                </div>
              </section>

              <section className="av-checkout-card">
                <div className="av-checkout-card-heading">
                  <div className="av-checkout-heading-icon">
                    <ShoppingBag
                      size={20}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p>
                      YOUR COLLECTION
                    </p>

                    <h2>
                      Selected artworks
                    </h2>
                  </div>
                </div>

                <div className="av-checkout-items">
                  {items.map(
                    (item) => {
                      const imageUrl =
                        getItemImage(
                          item
                        );

                      const productType =
                        item.product_type ||
                        "artwork";

                      const quantity =
                        productType ===
                        "edition"
                          ? Math.max(
                              1,
                              Number(
                                item.quantity ||
                                  1
                              )
                            )
                          : 1;

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

                      return (
                        <article
                          className="av-checkout-item"
                          key={`${item.id}-${productType}`}
                        >
                          <div className="av-checkout-item-image-wrapper">
                            {imageUrl ? (
                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  item.title ||
                                  "Artwork"
                                }
                                className="av-checkout-item-image"
                              />
                            ) : (
                              <div className="av-checkout-item-placeholder">
                                <ImageOff
                                  size={24}
                                  aria-hidden="true"
                                />
                              </div>
                            )}
                          </div>

                          <div className="av-checkout-item-copy">
                            <span>
                              {productType ===
                              "edition"
                                ? "Limited edition"
                                : "Original artwork"}
                            </span>

                            <h3>
                              {item.title ||
                                "Untitled Artwork"}
                            </h3>

                            <p>
                              by{" "}
                              {getArtistName(
                                item
                              )}
                            </p>
                          </div>

                          <div className="av-checkout-item-price">
                            <span>
                              Qty{" "}
                              {quantity}
                            </span>

                            <strong>
                              ₹
                              {formatCurrency(
                                safePrice *
                                  quantity
                              )}
                            </strong>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </section>
            </div>

            <aside className="av-checkout-summary">
              <div className="av-checkout-summary-header">
                <p>
                  ORDER SUMMARY
                </p>

                <h2>
                  Purchase details
                </h2>
              </div>

              <div className="av-checkout-summary-lines">
                <div>
                  <span>
                    Items
                  </span>

                  <strong>
                    {items.length}
                  </strong>
                </div>

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

                  <strong className="av-checkout-free">
                    Free
                  </strong>
                </div>

                {discount > 0 && (
                  <div>
                    <span>
                      Discount
                    </span>

                    <strong>
                      − ₹
                      {formatCurrency(
                        discount
                      )}
                    </strong>
                  </div>
                )}
              </div>

              <div className="av-checkout-total">
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

              <div className="av-checkout-delivery">
                <Truck
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Free insured
                    delivery
                  </strong>

                  <span>
                    Secure packaging for
                    every original
                    artwork.
                  </span>
                </div>
              </div>

              <label className="av-checkout-confirm">
                <input
                  type="checkbox"
                  checked={
                    acceptingTerms
                  }
                  onChange={(
                    event
                  ) => {
                    setAcceptingTerms(
                      event.target
                        .checked
                    );

                    clearMessage();
                  }}
                />

                <span>
                  I have reviewed my
                  delivery address,
                  selected artworks and
                  total amount.
                </span>
              </label>

              {message && (
                <div
                  className={`av-checkout-message av-checkout-message-${messageType}`}
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
                className="av-checkout-place-order"
                onClick={
                  handlePlaceOrder
                }
                disabled={
                  processing
                }
              >
                {processing ? (
                  <>
                    <LoaderCircle
                      className="av-checkout-spinner"
                      size={19}
                      aria-hidden="true"
                    />

                    Placing order...
                  </>
                ) : (
                  <>
                    <LockKeyhole
                      size={18}
                      aria-hidden="true"
                    />

                    Place order
                  </>
                )}
              </button>

              <p className="av-checkout-secure-text">
                <ShieldCheck
                  size={15}
                  aria-hidden="true"
                />

                Prices and artwork
                availability are
                verified by the server.
              </p>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}