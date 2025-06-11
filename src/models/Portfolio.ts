import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true,
    },
    stocks: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const Portfolio =
  mongoose.models.Portfolio || mongoose.model("Portfolio", PortfolioSchema);
