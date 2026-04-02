import enquiryModel from "../models/Enquirymodel.js";


export const CreateB2bEnquiry = async (req, res) => {
    try {
        // Log incoming payload for debugging
        console.info('CreateB2bEnquiry payload:', req.body);
        // Accept multiple possible field names from the frontend to be robust
        const {
            companyName,
            company_name,
            businessType,
            business_type,
            contactPerson,
            contactPersonName,
            contactName,
            contactNumber,
            phone,
            email,
            enquiryDetails,
            productsInterested,
            productsInterestedIn,
            quantityRequired,
            orderQuantity,
            message,
        } = req.body;

        // Normalize required fields
        const company = companyName || company_name;
        const contactPersonNormalized = contactPerson || contactPersonName || contactName;
        const contactPhone = contactNumber || phone;
        const products = enquiryDetails || productsInterested || productsInterestedIn || message;
        const expectedQuantity = quantityRequired || orderQuantity;
        // Normalize and map businessType to allowed enum values
        const rawBusinessType = (businessType || business_type || '').toString().trim().toLowerCase();
        const businessTypeMap = {
            retailer: 'Retailer',
            wholesaler: 'Wholesaler',
            distributor: 'Distributor',
            'hotel-restaurant': 'Hotel',
            hotel: 'Hotel',
            restaurant: 'Restaurant',
            caterer: 'Caterer',
            other: 'Other'
        };
        const businessTypeNormalized = businessTypeMap[rawBusinessType] || (rawBusinessType ? rawBusinessType.charAt(0).toUpperCase() + rawBusinessType.slice(1) : '');

        if (!company || !contactPersonNormalized || !contactPhone || !email) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing: companyName, contact person, phone, email",
            });
        }

        // Validate business type against model enum
        const allowedBusinessTypes = ['Retailer','Wholesaler','Distributor','Hotel','Restaurant','Caterer','Other'];
        if (businessTypeNormalized && !allowedBusinessTypes.includes(businessTypeNormalized)) {
            return res.status(400).json({ success: false, message: `Invalid businessType. Allowed: ${allowedBusinessTypes.join(', ')}` });
        }

        const enquiryData = new enquiryModel({
            companyName: company,
            businessType: businessTypeNormalized || 'Other',
            contactPersonName: contactPersonNormalized,
            email: email,
            phone: contactPhone,
            productsInterestedIn: products || '',
            expectedOrderQuantity: expectedQuantity || '',
            message: products || '',
            source: 'website-b2b'
        });

        await enquiryData.save();

        res.status(201).json({
            success: true,
            message: "Enquiry created successfully",
            data: enquiryData
        });
    } catch (error) {
        console.error('CreateB2bEnquiry error:', error);
        // Handle mongoose validation error in a friendly way
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join('; ') });
        }
        res.status(500).json({
            success: false,
            message: "Error while creating enquiry",
            error: error.message
        })
    }
}


export const GetAllB2bEnquiry = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        // 2️⃣ Calculate skip value
        const skip = (page - 1) * limit;

        // 3️⃣ Fetch enquiries (latest first)
        const enquiries = await enquiryModel
            .find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 4️⃣ Total count (for pagination UI)
        const totalEnquiries = await enquiryModel.countDocuments();

        // 5️⃣ Send response
        res.status(200).json({
            success: true,
            message: "B2B enquiries fetched successfully",
            data: enquiries,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalEnquiries / limit),
                totalEnquiries,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error while getting enquiry",
            error: error.message
        })
    }
}


export const UpdateB2bEnquiry = async (req, res) => {
    try {
        const enquiry = await enquiryModel.findById(req.params.id);
        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found"
            })
        }
        enquiry.company_name = req.body.company_name;
        enquiry.businessType = req.body.businessType;
        enquiry.contactPerson = req.body.contactPerson;
        enquiry.contactNumber = req.body.contactNumber;
        enquiry.email = req.body.email;
        enquiry.enquiryDetails = req.body.enquiryDetails;
        enquiry.quantityRequired = req.body.quantityRequired;
        await enquiry.save();
        res.status(200).json({
            success: true,
            message: "Enquiry updated successfully",
            enquiry
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error while updating enquiry",
            error: error.message
        })
    }
}