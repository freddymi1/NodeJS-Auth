const passport = require('passport');

module.export = (req, res, next) => {
    passport.authenticate('jwt', function(err, user, info){
        if(err) return next(err)

        if(!user) return res.status(401).json({message: "Unauthorized Access -No token provided!"});

        req.user = user;
        next();
    })(req, res, next)
}