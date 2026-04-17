import { Schema, model } from "mongoose";
import Field from "./Field.js";

const BookSchema = Schema (
    {

        field: {
            type: Schema.Types.ObjectId,
           ref: "Field",
            required: [true, "Debes elegir una cancha"],
        },
        date: {
            type:Date,
            required: [true, "La fecha de reserva es obligatoria"],
        },

        price:{
            type: Number,
            required: true,
        },

        time18hs: {
            status:{ type: String,
             enum: ["Pendiente","Confirmada","Cancelada"],
             default: "Cancelada"},
             user:{
                 type: Schema.Types.ObjectId,
                 ref: "User",
             }
        },
         time19hs: {
             status:{ type: String,
             enum: ["Pendiente","Confirmada","Cancelada"],
             default: "Cancelada"},
             user:{
                 type: Schema.Types.ObjectId,
                 ref: "User",
             }
        },
         time20hs: {
            status:{ type: String,
             enum: ["Pendiente","Confirmada","Cancelada"],
             default: "Cancelada"},
             user:{
                 type: Schema.Types.ObjectId,
                 ref: "User",
             }
        },
         time21hs: {
             status:{ type: String,
             enum: ["Pendiente","Confirmada","Cancelada"],
             default: "Cancelada"},
             user:{
                 type: Schema.Types.ObjectId,
                 ref: "User",
             }
        },
         time22hs: {
            status:{ type: String,
             enum: ["Pendiente","Confirmada","Cancelada"],
             default: "Cancelada"},
             user:{
                 type: Schema.Types.ObjectId,
                 ref: "User",
             }
        },
         time23hs: {
            status:{ type: String,
             enum: ["Pendiente","Confirmada","Cancelada"],
             default: "Cancelada"},
             user:{
                 type: Schema.Types.ObjectId,
                 ref: "User",
             }
        }},
    {
        timestamps: true,
    }
);

export default model("Book", BookSchema);
