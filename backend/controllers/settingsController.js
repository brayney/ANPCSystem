const LoginBackground = require('../models/LoginBackground');
const cloudinary = require('../config/cloudinary');

// Upload login background image (admin only)
const uploadLoginBackground = async (req, res) => {
  try {
    const { file } = req;

    // Debug logging
    console.log('Upload attempt - File:', file?.originalname, 'User:', req.user?._id);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Try both authenticated and unsigned upload methods
    let uploadResult;
    
    try {
      // Method 1: Try authenticated upload (with API secret)
      console.log('Attempting authenticated upload...');
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      uploadResult = await cloudinary.uploader.upload(base64, {
        folder: 'anpc-yard/login-backgrounds',
        resource_type: 'auto',
        quality: 'auto',
      });
      console.log('Authenticated upload successful:', uploadResult.public_id);
    } catch (authError) {
      console.log('Authenticated upload failed, trying unsigned upload...');
      // Method 2: Fall back to unsigned upload (frontend should do this instead)
      // For now, just re-throw the error
      throw authError;
    }

    // Delete previous background if exists
    const previousBg = await LoginBackground.findOne();
    if (previousBg) {
      try {
        await cloudinary.uploader.destroy(previousBg.cloudinaryPublicId);
        await LoginBackground.deleteOne({ _id: previousBg._id });
      } catch (destroyError) {
        console.error('Error deleting previous background:', destroyError);
      }
    }

    // Create new background record
    const background = new LoginBackground({
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      fileName: file.originalname,
      uploadedBy: req.user._id,
    });

    await background.save();

    res.status(201).json({
      success: true,
      message: 'Background image uploaded successfully',
      data: {
        id: background._id,
        fileName: background.fileName,
        imageUrl: background.cloudinaryUrl,
        uploadedAt: background.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Error uploading background:', error.message || error);
    if (error.http_code === 403) {
      console.error('Cloudinary authentication failed. Check API credentials.');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary authentication failed - please check server credentials',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload background image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get login background image
const getLoginBackground = async (req, res) => {
  try {
    const background = await LoginBackground.findOne().sort({ createdAt: -1 });

    if (!background) {
      return res.json({
        success: false,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        id: background._id,
        imageUrl: background.cloudinaryUrl,
        fileName: background.fileName,
        uploadedAt: background.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching background:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch background image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Delete login background image (admin only)
const deleteLoginBackground = async (req, res) => {
  try {
    const background = await LoginBackground.findOne();

    if (!background) {
      return res.status(404).json({
        success: false,
        message: 'No background image found to delete',
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(background.cloudinaryPublicId);

    // Delete from database
    await LoginBackground.deleteOne({ _id: background._id });

    res.json({
      success: true,
      message: 'Background image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting background:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete background image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  uploadLoginBackground,
  getLoginBackground,
  deleteLoginBackground,
};
