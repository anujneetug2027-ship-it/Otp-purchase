export const isAuth = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};
