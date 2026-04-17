import { MercadoPagoConfig, Preference } from "mercadopago";
import Product from "../models/Product.js";
import Book from "../models/Book.js";
import Cart from "../models/Cart.js";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const validateQuantity = (quantity) => {
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    const error = new Error("La cantidad debe ser un número entero mayor a 0");
    error.statusCode = 400;
    throw error;
  }

  return parsedQuantity;
};

const getActiveCartByUser = async (userId) => {
  const cart = await Cart.findOne({
    user: userId,
    active: true,
  }).populate({
    path: "items.product",
    select: "name price stock active",
  });

  return cart;
};

const buildProductPaymentItem = async (id, quantity = 1) => {
  const parsedQuantity = validateQuantity(quantity);

  const product = await Product.findById(id);

  if (!product || product.active === false) {
    const error = new Error("Producto no encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (typeof product.price !== "number" || product.price <= 0) {
    const error = new Error("El producto no tiene un precio válido");
    error.statusCode = 400;
    throw error;
  }

  if (product.stock < parsedQuantity) {
    const error = new Error("Stock insuficiente");
    error.statusCode = 400;
    throw error;
  }

  return {
    title: product.name,
    quantity: parsedQuantity,
    unit_price: product.price,
    currency_id: "ARS",
  };
};

const buildBookingPaymentItem = async (id, userId) => {
  const booking = await Book.findById(id).populate("field");

  if (!booking) {
    const error = new Error("Reserva no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (!booking.field) {
    const error = new Error("La reserva no tiene una cancha asociada");
    error.statusCode = 400;
    throw error;
  }

  const reservedByUser =
    booking.time18hs?.user?.toString() === userId.toString() ||
    booking.time19hs?.user?.toString() === userId.toString() ||
    booking.time20hs?.user?.toString() === userId.toString() ||
    booking.time21hs?.user?.toString() === userId.toString() ||
    booking.time22hs?.user?.toString() === userId.toString() ||
    booking.time23hs?.user?.toString() === userId.toString();

  if (!reservedByUser) {
    const error = new Error("No tienes permiso para pagar esta reserva");
    error.statusCode = 403;
    throw error;
  }

  if (typeof booking.price !== "number" || booking.price <= 0) {
    const error = new Error("La reserva no tiene un precio válido");
    error.statusCode = 400;
    throw error;
  }

  return {
    title: `Reserva cancha ${booking.field.name} - ${new Date(
      booking.date
    ).toLocaleDateString("es-AR")}`,
    quantity: 1,
    unit_price: booking.price,
    currency_id: "ARS",
  };
};

const buildCartPaymentData = async (userId) => {
  const cart = await getActiveCartByUser(userId);

  if (!cart || !cart.items || cart.items.length === 0) {
    const error = new Error("El carrito está vacío");
    error.statusCode = 400;
    throw error;
  }

  if (cart.paymentProcessed === true) {
    const error = new Error("Este carrito ya fue procesado");
    error.statusCode = 400;
    throw error;
  }

  const items = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || product.active === false) {
      const error = new Error("Hay productos inválidos en el carrito");
      error.statusCode = 400;
      throw error;
    }

    if (typeof product.price !== "number" || product.price <= 0) {
      const error = new Error(`El producto ${product.name} no tiene precio válido`);
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < item.quantity) {
      const error = new Error(`Stock insuficiente para ${product.name}`);
      error.statusCode = 400;
      throw error;
    }

    items.push({
      title: product.name,
      quantity: item.quantity,
      unit_price: product.price,
      currency_id: "ARS",
    });
  }

  return { cart, items };
};

const createPayment = async (req, res) => {
  try {
    const { type, id, quantity = 1 } = req.body || {};

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        ok: false,
        msg: "Usuario no autenticado",
      });
    }

    if (!type) {
      return res.status(400).json({
        ok: false,
        msg: "Debes enviar type",
      });
    }

    let items = [];
    let externalReference = null;
    let cartToUpdate = null;

    if (type === "product") {
      if (!id) {
        return res.status(400).json({
          ok: false,
          msg: "Debes enviar id del producto",
        });
      }

      const item = await buildProductPaymentItem(id, quantity);
      items = [item];
      externalReference = `product:${id}:user:${req.user._id}`;
    } else if (type === "booking") {
      if (!id) {
        return res.status(400).json({
          ok: false,
          msg: "Debes enviar id de la reserva",
        });
      }

      // IMPORTANTE:
      // usamos req.user._id y NO userId del body
      const item = await buildBookingPaymentItem(id, req.user._id);
      items = [item];
      externalReference = `booking:${id}:user:${req.user._id}`;
    } else if (type === "cart") {
      const { cart, items: cartItems } = await buildCartPaymentData(req.user._id);

      items = cartItems;
      cartToUpdate = cart;
      externalReference = String(cart._id);
    } else {
      return res.status(400).json({
        ok: false,
        msg: "Tipo de pago no válido",
      });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items,
        back_urls: {
          success: "http://localhost:3001/pago-exitoso",
          failure: "http://localhost:3001/pago-error",
          pending: "http://localhost:3001/pago-pendiente",
        },
        external_reference: externalReference,
      },
    });

    if (type === "cart" && cartToUpdate) {
      cartToUpdate.mpPreferenceId = result.id;
      await cartToUpdate.save();
    }

    return res.status(200).json({
      ok: true,
      id: result.id,
      url: result.init_point,
      sandboxUrl: result.sandbox_init_point || null,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.message || "Error interno del servidor",
    });
  }
};

/*
   Esta función es para usarla cuando Mercado Pago confirme
   que el pago fue aprobado.
*/

const processApprovedCartPayment = async (cartId, paymentId = null) => {
  const cart = await Cart.findById(cartId).populate({
    path: "items.product",
    select: "name price stock active",
  });

  if (!cart) {
    const error = new Error("Carrito no encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (!cart.items || cart.items.length === 0) {
    const error = new Error("El carrito está vacío");
    error.statusCode = 400;
    throw error;
  }

  // Evita procesar 2 veces el mismo carrito
  if (cart.paymentProcessed === true) {
    return {
      ok: true,
      message: "El pago ya fue procesado anteriormente",
      cart,
    };
  }

  // 1. Validar que todos los productos existan y tengan stock
  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);

    if (!product) {
      const error = new Error("Producto no encontrado");
      error.statusCode = 404;
      throw error;
    }

    if (product.active === false) {
      const error = new Error(`El producto ${product.name} está inactivo`);
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < item.quantity) {
      const error = new Error(`Stock insuficiente para el producto ${product.name}`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 2. Descontar stock de manera segura
  for (const item of cart.items) {
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: item.product._id,
        stock: { $gte: item.quantity },
      },
      {
        $inc: { stock: -item.quantity },
      },
      {
        new: true,
      }
    );

    if (!updatedProduct) {
      const error = new Error(
        `No se pudo actualizar el stock de ${item.product.name}`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Cerrar carrito y marcarlo como procesado
  cart.paymentProcessed = true;
  cart.active = false;

  if (paymentId) {
    cart.mpPaymentId = String(paymentId);
  }

  await cart.save();

  return {
    ok: true,
    message: "Pago procesado y stock actualizado correctamente",
    cart,
  };
};

export { createPayment, processApprovedCartPayment };
