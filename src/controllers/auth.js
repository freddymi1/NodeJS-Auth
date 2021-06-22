const User = require('../models/user');
const Token = require('../models/token');

const {sendEmail} = require('../utils/index');

// @route POST api/auth/register
// @desc Register user
// @access Public

exports.register = async (req, res) => {
    try{
        const {email} = req.body;

        //Assure que cette compte n'est pas encore exiter
        const user = await User.findOne({ email });

        if (user) return res.status(401).json({message: "Cette adresse email est deja assigne a une autre compte!"});

        const newUser = new User({ ...req.body, role: "basic" });

        const user_ = await newUser.save();

        await sendVerificationEmail(user_, req, res);
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
};

// @route POST api/auth/login
// @desc Login user and return JWT token
// @access Public

exports.login = async (req, res) => {
    try{
        const { email, password } = req.body;

        const user = await User.findOne({email});

        if (!user) return res.status(401).json({msg: 'L\'adresse email '+email+' n\'est pas encore inscrit. Veuillez s\'inscrire SVP!'});
        //validation password
        if(!user.comparepassword(password)) return res.status(401).json({message: 'Email ou mot de passe incorrect'});
        // Assurer que lutilisateur existe
        if(!user.isVerified) return res.status(401).json({type: 'not-verified', message: 'Votre compte n\'est pas encore verifier!'});

        //Login sucess, ecrire le token et r'envoyer a l'user
        res.status(200).json({token: user.generateJWT(), user: user});
    }catch (error){
        res.status(500).json({message: error.message})
    }
};

//VERIFICATION EMAIL
// @route GET api/verify/:token
// @desc Verify token
// @access Public

exports.verify = async (req, res) => {
    if(!req.params.token) return res.status(400).json({message: 'Nous n\'avons pas reussit a verifier cette token'});

    try{
        // Choisir le token correspond
        const token = await Token.findOne({ token: req.params.token });

        if(!token) return res.status(400).json({message: 'Nous ne pouvons pas '});
        //Si le token est verifier, verifier l'user correspond
        User.findOne({_id: token.userId}, (err, user)=> {
            if(!user) return res.status(400).json({message: 'Nous ne pouvons pas capable de choisr l\'user correspond a ce token'});
            if(user.isVerified) return res.status(400).json({message: 'Cette user est bien verifier'});

            //Verifier et enregistrer l'user
            user.isVerified = true;
            user.save(function (err){
                if (err) return res.status(500).json({message: err.message});

                res.status(200).send("Le compte a ete bien verifier. Login SVP!");
            });
        });
    }catch(error){
        res.status(500).json({message: error.message})
    }
};

// @route api/resend

// @desc Resend verification Token
// @access Public

exports.resendToken = async (req, res) => {
    try{
        const {email} = req.body;

        const user = await User.findOne({email});

        if(!user) return res.status(401).json({message: 'L\'email adresse '+req.body.email+' n\'est pas associee a une compte. Renvoyer le SVP!'});

        if(user.isVerified) return res.status(400).json({message: 'Cette email est deja validez. Se connecter SVP!'});

        await sendVerificationEmail(user, req, res);
    }catch(error){
        res.status(500).json({message: error.message})
    }
};

async function sendVerificationEmail(user, req, res){
    try{
        const token = user.generateVerificationToken();

        // Enregistrer la varificatin token
        await token.save();

        let subject = "Compte verification token";
        let to = user.email;

        let from = process.env.FROM_EMAIL;
        let link = "http://"+req.headers.host+"/api/auth/verify/"+token.token;
        let html = `<p>Salut ${user.username}<p><br/><p>Clik sur le  <a href="${link}">lien</a> dans votre email pour confirmer</p></p></p><br/>
        <p>Si vous ne voulez pas. Igniorer cette email SVP!</p>`;

        await sendEmail({to, from, subject, html});

        res.status(200).json({message: 'Une message de verification email a ete bien enoyer a '+user.email+'.'});
    }catch(error){
        res.status(500).json({message: error.message})
    }
}