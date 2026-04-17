import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";


const DEFAULT_IMAGE = "https://res.cloudinary.com/dp7qbi976/image/upload/v1733325605/v7fiv6xngp8o78v7a3sd.webp";

const getProducts = async (req, res) => {
  try {
    const { limit = 5, offset = 0 } = req.query;

    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    const query = { active: true };

    const [total, items] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .limit(parsedLimit)
        .skip(parsedOffset)
        .populate("category", "name"),
    ]);

    res.json({ total, items });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { price, stock, category, description, active } = req.body;
    const name = String(req.body.name).trim().toUpperCase();

    const existingItem = await Product.findOne({
      name,
      category,
      active: true,
    });

    if (existingItem) {
      return res.status(400).json({
        ok: false,
        message: `El producto ${name} ya existe`,
      });
    }

    let imageUrl = DEFAULT_IMAGE;

    if (req.files && req.files.archivo) {
      const file = req.files.archivo;
      const dataUri = `data:${file.mimetype};base64,${file.data.toString("base64")}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'productos' 
      });
      imageUrl = result.secure_url;
    }

    const data = {
      name,
      category,
      price,
      stock,
      description,
      active,
      image: imageUrl, 
      user: req.user._id,
    };

    const item = await Product.create(data);

    res.status(201).json({
      ok: true,
      message: `Producto ${item.name} creado`,
      item,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        message: "Ya existe un producto con ese nombre",
      });
    }

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, stock, category, description, active } = req.body;

    const data = {
      user: req.user._id,
    };

    if (price !== undefined) data.price = price;
    if (stock !== undefined) data.stock = stock;
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;
    if (active !== undefined) data.active = active;

    if (req.body.name) {
      data.name = String(req.body.name).trim().toUpperCase();
    }

    if (data.name) {
      const existingItem = await Product.findOne({
        name: data.name,
        category,
        active: true,
        _id: { $ne: id },
      });

      if (existingItem) {
        return res.status(400).json({
          ok: false,
          message: "Ya existe un producto con ese nombre",
        });
      }
    }

    if (req.files && req.files.archivo) {
      const file = req.files.archivo;
      const dataUri = `data:${file.mimetype};base64,${file.data.toString("base64")}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'productos'
      });
      data.image = result.secure_url; 
    }

    const updatedItem = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedItem) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Producto actualizado",
      item: updatedItem,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        ok: false,
        message: "Ya existe un producto con ese nombre",
      });
    }

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await Product.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );

    if (!deletedItem) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Producto eliminado",
      item: deletedItem,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

export {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
