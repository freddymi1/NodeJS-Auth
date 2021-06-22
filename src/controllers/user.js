const User = require('../models/user');
const {uploader, sendEmail} = require('../utils/index');

// @route GET admin/user
// @desc Returns all users
// @access Public
exports.index = async function (req, res) {
    const users = await User.find({});
    res.status(200).json({users});
};

// @route POST api/user
// @desc Add a new user
// @access Public
exports.store = async (req, res) => {
    try {
        const {email} = req.body;

        // Assuere que cette compte n'existe pas encore
        const user = await User.findOne({email});

        if (user) return res.status(401).json({message: 'Cette email est deja associer a une compte.'});

        const password = '_' + Math.random().toString(36).substr(2, 9); //generate a random password
        const newUser = new User({...req.body, password});

        const user_ = await newUser.save();

        //Generer le password token
        user_.generatePasswordReset();

        // Enregistrer la modification
        await user_.save();

        let domain = "http://" + req.headers.host;
        let subject = "Nouveau compte creer avec success";
        let to = user.email;
        let from = process.env.FROM_EMAIL;
        let link = "http://" + req.headers.host + "/api/auth/reset/" + user.resetPasswordToken;
        let html = `<p>Salut ${user.username}<p><br><p>Un nouveau compte a ete creer a ${domain}. Click sur le <a href="${link}">lien</a> pour valider votre compte SVP!.</p> 
                  <br><p>Igniorer cette message si vous ne voulez pas email.</p>`

        await sendEmail({to, from, subject, html});

        res.status(200).json({message: 'Une email a ete envoyee a ' + user.email + '.'});

    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
};

// @route GET api/user/{id}
// @desc Returns a specific user
// @access Public
exports.show = async function (req, res) {
    try {
        const id = req.params.id;

        const user = await User.findById(id);

        if (!user) return res.status(401).json({message: 'Utilisateur n\'existe pas'});

        res.status(200).json({user});
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};

// @route PUT api/user/{id}
// @desc Update user details
// @access Public
exports.update = async function (req, res) {
    try {
        const update = req.body;
        const id = req.params.id;
        const userId = req.user._id;

        //Make sure the passed id is that of the logged in user
        if (userId.toString() !== id.toString()) return res.status(401).json({message: "Vous n'avez pas le droit de modifier cette user."});

        const user = await User.findByIdAndUpdate(id, {$set: update}, {new: true});

        //Verifier si c'est image
        if (!req.file) return res.status(200).json({user, message: 'User modifier avec success'});

        //temp to upload sur cloudinary
        const result = await uploader(req);
        const user_ = await User.findByIdAndUpdate(id, {$set: update}, {$set: {profileImage: result.url}}, {new: true});

        if (!req.file) return res.status(200).json({user: user_, message: 'User bien modifier'});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// @route DESTROY api/user/{id}
// @desc Delete User
// @access Public
exports.destroy = async function (req, res) {
    try {
        const id = req.params.id;
        const user_id = req.user._id;

        //Make sure the passed id is that of the logged in user
        if (user_id.toString() !== id.toString()) return res.status(401).json({message: "Vous n\'avez pas la permission de supprimer cette donnee."});

        await User.findByIdAndDelete(id);
        res.status(200).json({message: 'User bien supprimer'});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};