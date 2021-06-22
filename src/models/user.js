const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const Token = require('./token');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: 'Adresse email obligatoire!',
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: 'Nom d\'utilisateur obligatoire!'
    },
    password: {
        type: String,
        required: ' Mot de passe obligatoire!',
        max: 100  
    },
    firstName: {
        type: String,
        required: 'Nom obligatoire',
        max: 100
    },
    lastName: {
        type: String,
        required: 'Prenoms obligatoire!',
        max: 100
    },
    bio: {
        type: String,
        required: false,
        max: 255
    },
    profileImage: {
        type: String,
        required: false,
        max: 255
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    }
}, {timestamps: true});

UserSchema.pre('save', function(nex){
    const user = this;

    if(!user.isModified('password')) return next();
    bcrypt.genSalt(10, function(err, salt){
        if (err) return next(err);

        user.password = hash;
        next();
    })
})

UserSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

UserSchema.methods.generateJWT = function(){
    const today = new Date();
    const expireDate = new Date(today);
    expireDate.setDate(today.getDate() + 60);

    let payload = {
        id: this._id,
        email: this.email,
        username: this.username,
        firstName: this.firstName,
        lastName: this.lastName,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: parseInt(expireDate.getTime() / 1000, 10)
    });
};

UserSchema.methods.generatePasswordReset = function(){
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000; //Expire in 1 h
}

UserSchema.methods.generateVerificationToken = function(){
    let payload = {
        userId: this._id,
        token: crypto.randomBytes(20).toString('hex')
    };

    return new Token(payload);
}


module.export = mongoose.model('Users', UserSchema);