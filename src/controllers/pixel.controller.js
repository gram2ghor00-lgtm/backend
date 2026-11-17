import PixelModel from "../models/pixel.model.js";

// Admin: Get full pixel configuration (including CAPI token if set)
export const getPixelAdminController = async (req, res) => {
    try {
        let config = await PixelModel.findOne();
        if (!config) {
            config = {
                pixelId: "",
                isEnabled: false,
                capiToken: "",
                testEventCode: ""
            };
        }

        return res.json({
            data: config,
            error: false,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Admin: Save or update pixel configuration
export const savePixelAdminController = async (req, res) => {
    try {
        const { pixelId, isEnabled, capiToken, testEventCode } = req.body;

        const updateData = {
            pixelId: (pixelId || "").trim(),
            isEnabled: Boolean(isEnabled),
            capiToken: (capiToken || "").trim(),
            testEventCode: (testEventCode || "").trim()
        };

        const config = await PixelModel.findOneAndUpdate(
            {},
            { $set: updateData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.json({
            message: "Meta Pixel configuration saved successfully",
            data: config,
            error: false,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Client: Public endpoint for frontend tracking (exposes only pixelId & isEnabled)
export const getPixelClientController = async (req, res) => {
    try {
        const config = await PixelModel.findOne();

        return res.json({
            data: {
                pixelId: config?.pixelId || "",
                isEnabled: Boolean(config?.isEnabled && config?.pixelId)
            },
            error: false,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};
