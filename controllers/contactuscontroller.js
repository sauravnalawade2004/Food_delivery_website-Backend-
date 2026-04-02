import { contactUs } from "../models/contactusmodel.js";

const createContactUs = async (req, res) => {
    try {
        console.info('createContactUs payload:', req.body);
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const contactUsData = new contactUs({ name, email, message });
        await contactUsData.save();
        res.status(201).json({
            success: true,
            message: "Contact created successfully",
            data: contactUsData
        });
    } catch (error) {
        console.error('createContactUs error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join('; ') });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const getContactUs = async (req, res) => {
    try {
        const contactUsData = await contactUs.find();
        res.status(200).json({
            success: true,
            message: "Contact us fetched successfully",
            data: contactUsData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

export { createContactUs, getContactUs };