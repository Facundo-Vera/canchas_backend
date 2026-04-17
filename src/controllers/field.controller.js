import { v2 as cloudinary } from "cloudinary";
import Field from "../models/Field.js";


const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=500&auto=format&fit=crop";

const getFields = async (req, res) => {
    try {
        const { limite = 50, desde = 0 } = req.query;

        const [total, fields] = await Promise.all([
            Field.countDocuments({ isDeleted: false }),
            Field.find({ isDeleted: false })
                .limit(Number(limite))
                .skip(Number(desde))
        ]);
        res.status(200).json({
            ok: true,
            total,
            fields 
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener las canchas",
            error: error.message
        });
    }
};

const createField = async (req, res) => {
    try {
        const { pricePerHour } = req.body;
        const name = req.body.name.toUpperCase();

        const fieldDb = await Field.findOne({ name });
        if (fieldDb) {
            return res.status(400).json({
                ok: false,
                message: `La cancha ${name} ya existe en el complejo.`,
            });
        }

        
        let imageUrl = DEFAULT_IMAGE;

        if (req.files && req.files.archivo) {
            const file = req.files.archivo;
            const dataUri = `data:${file.mimetype};base64,${file.data.toString("base64")}`;
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'canchas'
            });
            imageUrl = result.secure_url;
        }

        const newField = new Field({
            name: name,
            pricePerHour,
            image: imageUrl
        });

        await newField.save();

        res.status(201).json({
            ok: true,
            message: `La cancha ${name} se creó con éxito.`,
            field: newField
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al crear la cancha.",
            error: error.message
        });
    }
};

const updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, pricePerHour, active } = req.body;

       
        let data = { active };
        if (name) data.name = name.toUpperCase();
        if (pricePerHour) data.pricePerHour = pricePerHour;

        
        if (req.files && req.files.archivo) {
            const file = req.files.archivo;
            const dataUri = `data:${file.mimetype};base64,${file.data.toString("base64")}`;
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'canchas'
            });
            data.image = result.secure_url;
        }

        const fieldUpdated = await Field.findByIdAndUpdate(id, data, { new: true });

        if (!fieldUpdated) {
            return res.status(404).json({
                ok: false,
                message: "No se encontró la cancha con ese ID"
            });
        }

        res.status(200).json({
            ok: true,
            message: "Cancha actualizada correctamente",
            field: fieldUpdated
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al actualizar la cancha",
            error: error.message
        });
    }
};

const deleteField = async (req, res) => {
    try {
        const { id } = req.params;

        const fieldDeleted = await Field.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

        if (!fieldDeleted) {
            return res.status(404).json({
                ok: false,
                message: "No se encontró la cancha con ese ID."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Cancha dada de baja correctamente",
            field: fieldDeleted
        });


    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al eliminar la cancha",
            error: error.message
        });
    }
};

export { getFields, createField, updateField, deleteField };
