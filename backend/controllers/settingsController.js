const LoginBackground = require('../models/LoginBackground');
const cloudinary = require('../config/cloudinary');

// Upload login background image (admin only)
const uploadLoginBackground = async (req, res) => {
  try {
    const files = [...(req.files?.images || []), ...(req.files?.image || [])];

    // Debug logging
    console.log('Upload attempt - Files:', files.length, 'User:', req.user?._id);

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const backgrounds = await Promise.all(files.map(async (file) => {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: 'anpc-yard/login-backgrounds', resource_type: 'auto', quality: 'auto',
      });
      return LoginBackground.create({
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        fileName: file.originalname,
        uploadedBy: req.user._id,
      });
    }));

    if (req.body.replace === 'true') {
      const previousBackgrounds = await LoginBackground.find({ _id: { $nin: backgrounds.map(background => background._id) } });
      await Promise.all(previousBackgrounds.map(background => cloudinary.uploader.destroy(background.cloudinaryPublicId)));
      await LoginBackground.deleteMany({ _id: { $in: previousBackgrounds.map(background => background._id) } });
    }

    res.status(201).json({
      success: true,
      message: `${backgrounds.length} background image${backgrounds.length === 1 ? '' : 's'} uploaded successfully`,
      data: backgrounds.map(formatBackground),
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
    const backgrounds = await LoginBackground.find().sort({ createdAt: -1 });
    const images = backgrounds.map(formatBackground);

    if (!images.length) {
      return res.json({
        success: false,
        data: null,
      });
    }

    res.json({
      success: true,
      data: images[0],
      images,
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
    const backgrounds = req.params.id
      ? await LoginBackground.find({ _id: req.params.id })
      : await LoginBackground.find();

    if (!backgrounds.length) {
      return res.status(404).json({
        success: false,
        message: 'No background image found to delete',
      });
    }

    await Promise.all(backgrounds.map(background => cloudinary.uploader.destroy(background.cloudinaryPublicId)));
    await LoginBackground.deleteMany({ _id: { $in: backgrounds.map(background => background._id) } });

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

const formatBackground = (background) => ({
  id: background._id,
  imageUrl: background.cloudinaryUrl,
  fileName: background.fileName,
  uploadedAt: background.uploadedAt,
});

// Update user language preference
const updateLanguage = async (req, res, next) => {
  try {
    const { language } = req.body;
    const validLanguages = ['en', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja'];

    if (!language || !validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language. Supported languages: ' + validLanguages.join(', '),
      });
    }

    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { language },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Language preference updated successfully',
      data: { language: user.language },
    });
  } catch (error) {
    console.error('Error updating language:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language preference',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Upload profile avatar (protected - own avatar only)
const uploadAvatar = async (req, res) => {
  try {
    const { file } = req;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete previous avatar from Cloudinary if exists
    if (user.avatar?.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatar.cloudinaryPublicId);
      } catch (destroyError) {
        console.error('Error deleting previous avatar:', destroyError);
      }
    }

    // Upload new avatar
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: 'anpc-yard/avatars',
      resource_type: 'auto',
      quality: 'auto',
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face',
    });

    user.avatar = {
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      fileName: file.originalname,
    };

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Profile avatar updated successfully',
      data: {
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Error uploading avatar:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Delete profile avatar (protected - own avatar only)
const deleteAvatar = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.avatar?.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatar.cloudinaryPublicId);
      } catch (destroyError) {
        console.error('Error deleting avatar from Cloudinary:', destroyError);
      }
    }

    user.avatar = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Profile avatar deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting avatar:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  uploadLoginBackground,
  getLoginBackground,
  deleteLoginBackground,
  updateLanguage,
  uploadAvatar,
  deleteAvatar,
};
