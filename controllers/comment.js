'use strict'

var validator = require('validator');
var Topic = require('../models/topic');

var controller = {
    add: function(req, res) {

        var topicId = req.params.topicId;

        Topic.findById(topicId).exec((err, topic) => {
            if(err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error en la petición'
                });
            }

            if(!topic) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el tema'
                });
            }

            if(req.body.content) {
                try {
                    var validate_content = !validator.isEmpty(req.body.content);
                }catch(err){
                    return res.status(200).send({
                        message: 'No has comentado nada'
                    });
                }

                if(validate_content) {
                    var comment = {
                        user: req.user.sub,
                        content: req.body.content
                    };

                    topic.comments.push(comment);

                    topic.save((err) => {
                        if(err) {
                            return res.status(500).send({
                                status: 'error',
                                message: 'Error al guardar el comentario'
                            });
                        }

                        Topic.findById(topic._id)
                            .populate('user')
                            .populate('comments.user')
                            .exec((err, topic) => {

                                if(err) {
                                    return res.status(500).send({
                                        status: 'error',
                                        message: 'Error en la petición'
                                    });
                                }

                                if(!topic) {
                                    return res.status(404).send({
                                        status: 'error',
                                        message: 'No hay temas para mostrar'
                                    });
                                }

                                return res.status(200).send({
                                    status: 'success',
                                    topic
                                });
                            });
                            
                    });

                }else{
                    return res.status(200).send({
                        message: 'Error al validar los datos del comentario'
                    });
                }
            }

        });
    },
    update: function(req, res) {

        var commentId = req.params.commentId;

        var params = req.body;
        try {
            var validate_content = !validator.isEmpty(params.content);
        }catch(err){
            return res.status(200).send({
                message: 'No has comentado nada'
            });
        }

        if(validate_content) {

            Topic.findOneAndUpdate(
                {"comments._id": commentId},
                {
                        "$set": {
                            "comments.$.content": params.content
                        }
                },
                {new: true},
                (err, topicUpdated) => {

                    if(err) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error en la petición'
                        });
                    }

                    if(!topicUpdated) {
                        return res.status(404).send({
                            status: 'error',
                            message: 'No existe el tema'
                        });
                    }

                    return res.status(200).send({
                        status: 'success',
                        topic: topicUpdated
                    });
                }
            );
        } 
    },
    delete: function(req, res) {

        var topicId = req.params.topicId;
        var commentId = req.params.commentId;

        Topic.findById(topicId, (err, topic) => {

            if(err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error en la petición'
                });
            }

            if(!topic) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el tema'
                });
            }

            var comment = topic.comments.id(commentId);
            if(comment) {
                comment.remove();

                topic.save((err) => {
                    if(err) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error en la petición'
                        });
                    }

                    Topic.findById(topic._id)
                        .populate('user')
                        .populate('comments.user')
                        .exec((err, topic) => {

                            if(err) {
                                return res.status(500).send({
                                    status: 'error',
                                    message: 'Error en la petición'
                                });
                            }

                            if(!topic) {
                                return res.status(404).send({
                                    status: 'error',
                                    message: 'No hay temas para mostrar'
                                });
                            }

                            return res.status(200).send({
                                status: 'success',
                                topic
                            });
                        });

                });
            }else{
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el comentario'
                });
            }
        });
    }

};

module.exports = controller;