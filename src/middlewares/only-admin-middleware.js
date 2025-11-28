const allowOnlyAdmin = (req, res, next) => {
  const user = req.user.user;

  console.log(user);

  if (!user.is_admin) {
    res.status(401);
    res.json({ message: 'Only admin can have access' });
    return;
  }

  next();
}

export default allowOnlyAdmin