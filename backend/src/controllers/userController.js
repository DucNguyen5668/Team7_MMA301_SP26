const User = require("../models/User");
const bcrypt = require("bcrypt");

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/me
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, dob, gender, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, phone, dob, gender, bio },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    // Password strength validation
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 1 chữ hoa" });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 1 chữ thường" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 1 chữ số" });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// PUT /api/users/avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const { avatar } = req.body; // base64 data URI or URL string
    if (!avatar) return res.status(400).json({ message: "No avatar provided" });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
