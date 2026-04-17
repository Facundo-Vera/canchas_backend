import Book from "../models/Book.js";
import Field from "../models/Field.js";

const getBookTimes = async (req, res) => {
  const { fieldId, date } = req.body;

  try {
    if (!fieldId || !date) {
      return res.status(400).json({
        ok: false,
        message: "Debe enviar fieldId y date",
      });
    }

    const existingBooking = await Book.findOne({
      field: fieldId,
      date: date,
    }).sort({ _id: -1 });

    if (!existingBooking) {
      const field = await Field.findById(fieldId);

      if (!field) {
        return res.status(404).json({
          ok: false,
          message: "Cancha no encontrada",
        });
      }

      const newBooking = new Book({
        field: fieldId,
        date,
        price: field.pricePerHour,
      });

      await newBooking.save();

      return res.status(200).json({
        ok: true,
        msg: newBooking,
      });
    }

    return res.status(200).json({
      ok: true,
      msg: existingBooking,
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

const reserveCourt = async (req, res) => {
  const { fieldId, date, time, userId, status } = req.body;

  try {
    if (!fieldId || !date || time === undefined || !userId || !status) {
      return res.status(400).json({
        ok: false,
        message: "Faltan datos obligatorios",
      });
    }

    const parsedTime = Number(time);

    const existingBooking = await Book.findOne({
      field: fieldId,
      date: date,
    }).sort({ _id: -1 });

    if (!existingBooking) {
      return res.status(404).json({
        ok: false,
        message: "No existe una grilla de turnos para esa cancha y fecha",
      });
    }

    switch (parsedTime) {
      case 18:
        existingBooking.time18hs = { status, user: userId };
        break;

      case 19:
        existingBooking.time19hs = { status, user: userId };
        break;

      case 20:
        existingBooking.time20hs = { status, user: userId };
        break;

      case 21:
        existingBooking.time21hs = { status, user: userId };
        break;

      case 22:
        existingBooking.time22hs = { status, user: userId };
        break;

      case 23:
        existingBooking.time23hs = { status, user: userId };
        break;

      default:
        return res.status(400).json({
          ok: false,
          message: "Horario inválido. Solo se permite de 18 a 23 hs",
        });
    }

    await existingBooking.save();

    return res.status(200).json({
      ok: true,
      msg: existingBooking,
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
};

export { getBookTimes, reserveCourt };
