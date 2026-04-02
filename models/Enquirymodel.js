import mongoose from 'mongoose';


const EnquirySchema = new mongoose.Schema({
   companyName: {
    type: String,
    required: true,
  },

  businessType: {
    type: String,
    enum: [
      "Retailer",
      "Wholesaler",
      "Distributor",
      "Hotel",
      "Restaurant",
      "Caterer",
      "Other",
    ],
    required: true,
  },

  // Contact Person
  contactPersonName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  // Enquiry Details
  productsInterestedIn: {
    type: String,
    required: true,
  },

  expectedOrderQuantity: {
    type: String,
  },

  message: {
    type: String,
  },

  // Lead Management (VERY IMPORTANT)
  status: {
    type: String,
    enum: ["new", "contacted", "negotiation", "converted", "rejected"],
    default: "new",
  },

  assignedTo: {
    type: String, 
  },

  source: {
    type: String,
    default: "website-b2b",
  },
}, {timestamps: true});

 const enquiryModel = mongoose.model("enquiry", EnquirySchema);
 export default enquiryModel;