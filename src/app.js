import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware.js";

import path from "path";
import { fileURLToPath } from "url";

import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";


import routeBooking from "./routes/book.route.js"
import nodemailerRouter from "./routes/nodemailer.routes.js"
import registerRouter from "./routes/register.routes.js";
import loginRouter from "./routes/login.routes.js";
import userRouter from "./routes/user.routes.js";
import cartRouter from "./routes/cart.routes.js"
import fieldRoutes from "./routes/field.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import productRoutes from "./routes/products.routes.js";
import searchRoutes from "./routes/search.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import uploadRouter from "./routes/upload.routes.js"
import logoutRouter from "./routes/logout.routes.js"


const app = express();

app.use(morgan("dev")); 
app.use(express.json()); 
app.use(express.urlencoded({extended: true})); 


app.use(cookieParser())
app.use(fileUpload())

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(
  cors({
    origin: "https://futboldev5-proyecto.netlify.app",
    credentials: true,
  })
);

app.use("/api/register", registerRouter);
app.use("/api/login", loginRouter);
app.use("/api/users", userRouter);
app.use("/api/fields", fieldRoutes);
app.use("/api/upload",uploadRouter)
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/cart", cartRouter);
app.use("/api/book",routeBooking);
app.use("/api/contact", nodemailerRouter)
app.use("/api/logout",logoutRouter)
app.use(express.static(path.join(__dirname, "../api")));
app.get("/index", (req, res) => {
  res.status(200).json({ ok: true });
});
app.use((req, res, next) => {
  return res.status(404).json({
    ok: false,
    status: 404,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
})
app.use(errorHandler)




export default app;

