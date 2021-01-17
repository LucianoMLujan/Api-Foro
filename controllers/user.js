'use strict'

var validator = require('validator');
var bcrypt = require('bcrypt');
var fs = require('fs');
var path = require('path');
var User = require('../models/user');
var jwt = require('../services/jwt');

var controller = {

    save : function(req, res) {
        //Get data
        var params = req.body;

        //Validate data
        try{
            var validate_name = !validator.isEmpty(params.name);
            var validate_surname = !validator.isEmpty(params.surname);
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
            var validate_password = !validator.isEmpty(params.password);
        }catch(ex){
            return res.status(200).send({
                message: 'Faltan datos por enviar'
            });
        }
        
        if(validate_name && validate_surname && validate_email && validate_password){
            //Create user object
            var user = new User();
            user.name = params.name;
            user.surname = params.surname;
            user.email = params.email.toLowerCase();
            user.role = 'ROLE_USER';
            user.image = null;

            User.findOne({email: user.email}, (err, issetUser) => {
                if(err) {
                    return res.status(500).send({
                        message: 'No puedes agregar dos usuarios con el mismo email.'
                    });
                }
                if(!issetUser){
                    //Encrypt password
                    bcrypt.hash(params.password, 10, function(err, hash) {
                        user.password = hash;
                        
                        //Save user
                        user.save((err, userStored) => {
                            if(err) {
                                return res.status(500).send({
                                    message: 'Error al guardar el usuario.'
                                });
                            }
                            if(!userStored){
                                return res.status(400).send({
                                    message: 'Error al guardar el usuario.'
                                });
                            }

                            return res.status(200).send({
                                status: 'success',
                                user: userStored
                            });
                        });
                    });

                }else{
                    return res.status(200).send({
                        message: 'El usuario ya esta registrado.'
                    });
                }
            });
        }else{
            return res.status(200).send({
                message: 'Validación de los datos incorrecta, vuelva a intentarlo.'
            });
        }
    },
    login : function(req, res) {
        //Get data
        var params = req.body;

        //Validate data
        try{
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
            var validate_password = !validator.isEmpty(params.password);
        }catch(ex){
            return res.status(200).send({
                message: 'Faltan datos por enviar'
            });
        }

        if(!validate_email || !validate_password) {
            return res.status(200).send({
                message: 'Los datos son incorrectos'
            });
        }

        User.findOne({email: params.email.toLowerCase()}, (err, user) => {

            if(err) {
                return res.status(500).send({
                    message: 'Error al intentar identificarse'
                });
            }

            if(!user) {
                return res.status(404).send({
                    message: 'El usuario no existe'
                });
            }

            bcrypt.compare(params.password, user.password, (err, check) => {
                if(check) {
                    //Generate token JWT
                    if(params.getToken) {
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{
                        user.password = undefined;
                        return res.status(200).send({
                            status: 'succes',
                            user
                        });
                    }

                }else{
                    return res.status(200).send({
                        message: 'Las credenciales no son correctas.'
                    });
                }
            });
        });        
    },
    update : function(req, res) {

        var params = req.body;

        //Validate data
        try{
            var validate_name = !validator.isEmpty(params.name);
            var validate_surname = !validator.isEmpty(params.surname);
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
        }catch(ex){
            return res.status(200).send({
                message: 'Faltan datos por enviar'
            });
        }

        delete params.password;
        var userId = req.user.sub;

        if(req.user.email != params.email){
            User.findOne({email: params.email.toLowerCase()}, (err, user) => {

                if(err) {
                    return res.status(500).send({
                        message: 'Error al intentar identificarse'
                    });
                }
    
                if(user && user.email == params.email) {
                    return res.status(200).send({
                        message: 'No puede haber dos usuarios con el mismo email'
                    });
                }else{
                    User.findOneAndUpdate({_id: userId}, params, {new: true}, (err, userUpdated) => {

                        if(err || !userUpdated) {
                            return res.status(200).send({
                                status: 'error',
                                mesage: 'Error al actualizar usuario'
                            });
                        }
        
                        return res.status(200).send({
                            status: 'success',
                            user: userUpdated
                        });
                    });
                }
            });

        }else{
            User.findOneAndUpdate({_id: userId}, params, {new: true}, (err, userUpdated) => {

                if(err || !userUpdated) {
                    return res.status(200).send({
                        status: 'error',
                        mesage: 'Error al actualizar usuario'
                    });
                }

                return res.status(200).send({
                    status: 'success',
                    user: userUpdated
                });
            });
        }
    },
    uploadAvatar: function(req, res) {

        var file_name = 'Avatar no subido...';

        if(JSON.stringify(req.files) === JSON.stringify({})) {
            return res.status(404).send({
                status: 'error',
                message: file_name
            });
        }

        var file_path = req.files.file0.path;
        var file_split = file_path.split('\\');
        /*
            EN LINUX O MAC USAR
            var file_split = file_path.split('/');
        */ 
        var file_name = file_split[2];
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if(file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' && file_ext != 'gif') {
            fs.unlink(file_path, (err) => {
                return res.status(200).send({
                    status: 'error',
                    message: 'La extension del archivo no es valida.'
                });
            });
        }else{
            var userId = req.user.sub;

            User.findOneAndUpdate({_id: userId}, {image: file_name}, {new: true}, (err, userUpdated) => {

                if(err || !userUpdated) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error al actualizar el usuario'
                    });
                }

                return res.status(200).send({
                    status: 'success',
                    user: userUpdated
                });
            });
        }
    },
    avatar: function(req, res) {
        var fileName = req.params.fileName;
        var filePath = './uploads/users/'+fileName;

        fs.exists(filePath, (exists) => {
            if(exists) {
                return res.sendFile(path.resolve(filePath));
            }else{
                return res.status(404).send({
                    message: 'La imagen no existe'
                });
            }
        });

    },
    getUsers: function(req, res) {
        User.find().exec((err, users) => {
            if(err || !users){
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay usuarios que mostrar'
                });
            }

            return res.status(200).send({
                status: 'success',
                users
            });

        });
    },
    getUser: function(req, res) {
        var userId = req.params.userId;

        User.findById(userId).exec((err, user) => {
            if(err || !user){
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el usuario'
                });
            }

            return res.status(200).send({
                status: 'success',
                user
            });
        });
    },
};

module.exports = controller;