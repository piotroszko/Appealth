import mongoose from "mongoose";

const { Schema, model } = mongoose;

export interface IProject {
  _id: string;
  userId: string;
  name: string;
  domainName: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    _id: { type: String },
    userId: { type: String, ref: "User", required: true },
    name: { type: String, required: true },
    domainName: { type: String, required: true },
    url: { type: String, default: "" },
  },
  { collection: "project", timestamps: true },
);

projectSchema.index({ userId: 1 });

const Project = (mongoose.models.Project as mongoose.Model<IProject>) || model<IProject>("Project", projectSchema);

export { Project };
