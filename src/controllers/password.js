const User = require('../models/user');
const {sendEmail} = require('../utils/index');

// @route POST api/auth/recover
// @desc Recover Password
// @access Public
exports.recover = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ message: 'L\'email adresse ' + req.body.email + ' n\'est pas associer an une user.'});

        //Generer le password token
        user.generatePasswordReset();

        // Enregistrer l'user modifier
        await user.save();

        // Envoi email
        let subject = "Password change request";
        let to = user.email;
        let from = process.env.FROM_EMAIL;
        let link = "http://" + req.headers.host + "/api/auth/reset/" + user.resetPasswordToken;
        let html = `<p>Salut ${user.username}</p>
                    <p>Click sur le <a href="${link}">lien</a> pour reinitialiser votre mot de passe.</p> 
                    <p>Si vous ne vouler pas, igniorer cette email.</p>`;

        await sendEmail({to, from, subject, html});

        res.status(200).json({message: 'Une message de reinitialisation mot de passe a etet envoyee a ' + user.email + '.'});
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

// @route POST api/auth/reset
// @desc Reset Password 
// @access Public
exports.reset = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}});

        if (!user) return res.status(401).json({message: 'Reinitialisation de mot de passe est invalide.'});

        //Rediriger l'user vers son email
        res.render('reset', {user});
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

// @route POST api/auth/reset
// @desc Reset Password
// @access Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}});

        if (!user) return res.status(401).json({message: 'Le token de reinitialisation de mot de passe est invalide ou expirer.'});

        //Entrer le nouveau password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.isVerified = true;

        // Enregistrer la modification
        await user.save();

        let subject = "Votre mot de passe a ete bien changer";
        let to = user.email;
        let from = process.env.FROM_EMAIL;
        let html = `<p>Salut ${user.username}</p>
                    <p>C\'est une confirmation pour que le mot de passe de ${user.email} a ete bien modifier.</p>`

        await sendEmail({to, from, subject, html});

        res.status(200).json({message: 'Votre mot de passe est bien modifier.'});

    } catch (error) {
        res.status(500).json({message: error.message})
    }
};