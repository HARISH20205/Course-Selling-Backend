import jwt from "jsonwebtoken";

// Use environment variables if available, otherwise use default values
const SECRET_ADMIN_KEY = process.env.SECRET_ADMIN_KEY || "ADMIN";
const SECRET_USER_KEY = process.env.SECRET_USER_KEY || "USER";

const generateJwt = (user, secretKey) => {
  const payload = { username: user.username };
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};

const jwtAuthentication = (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = auth.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Token missing in Authorization header" });
    }

    const secretKey = req.path.startsWith("/admin")
      ? SECRET_ADMIN_KEY
      : SECRET_USER_KEY;

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token expired" });
        }
        return res.status(403).json({ message: "Invalid token" });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during authentication" });
  }
};

export { generateJwt, jwtAuthentication };
