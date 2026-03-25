const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  console.log(req.cookies);
  
    return next()
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    return next()
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");

    // gắn user cho controller dùng
    req.user = payload;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
