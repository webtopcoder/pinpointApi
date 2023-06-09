const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Contact = new Schema(
    {
      user: {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true },
      },
      subject: { type: String },
      message: { type: String, required: true },
      usertype: { type: String, required: true, enum: ["user", "partner"] },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Contact.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Contact.plugin(toJSON);
  Contact.plugin(mongoosePaginate);

  /**
   * @typedef Contact
   */
  return model("Contact", Contact);
};
