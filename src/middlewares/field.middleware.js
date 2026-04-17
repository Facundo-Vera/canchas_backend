import { validationResult } from "express-validator";
import { check } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      message: "Datos inválidos",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
};

export const validateCreateField = [
  check("name", "El nombre de la cancha es obligatorio y debe tener al menos 3 letras")
    .notEmpty()
    .isLength({ min: 3 }),
  check("pricePerHour", "El precio por hora es obligatorio y debe ser un número mayor a 0")
    .isNumeric()
    .custom((value) => value > 0),
  validate
];


export const validateUpdateField = [
  check("id", "No es un ID válido de MongoDB").isMongoId(),
  check("name", "Si envías un nombre, debe tener al menos 3 letras")
    .optional()
    .isLength({ min: 3 }),
  check("pricePerHour", "Si envías un precio, debe ser un número mayor a 0")
    .optional()
    .isNumeric()
    .custom((value) => value > 0),
  validate
];


export const validateDeleteField = [
  check("id", "No es un ID válido de MongoDB").isMongoId(),
  validate
];
