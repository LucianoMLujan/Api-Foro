'use strict'

var validator = require('validator');
const topic = require('../models/topic');
var Topic = require('../models/topic');

var controller = {

    save: function(req, res) {

        var params = req.body;

        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);
        }catch(err){
            return res.status(200).send({
                message: 'Faltan datos por enviar'
            });
        }

        if(validate_title && validate_content && validate_lang) {

            var topic = new Topic();
            topic.title = params.title;
            topic.content = params.content;
            topic.code = params.code;
            topic.lang = params.lang;
            topic.user = req.user.sub;

            //Save topic en DB
            topic.save((err, topicStored) => {

                if(err || !topicStored) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'El tema no se ha guardado'
                    });
                }

                return res.status(200).send({
                    status: 'success',
                    topic: topicStored
                });
            });

        }else{
            return res.status(200).send({
                message: 'Los datos no son validos'
            });
        }
    },
    getTopics: function(req, res) {

        
        if(!req.params.page || req.params.page == null || req.params.page == undefined || req.params.page == 0 || req.params.page == "0") {
            var page = 1;
        }else{
            var page = parseInt(req.params.page);
        }

        var options = {
            sort: { date: -1 },
            populate: 'user',
            limit: 5,
            page: page
        };

        Topic.paginate({}, options, (err, topics) => {

            if(err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al hacer la consulta'
                });
            }

            if(!topics) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay datos para mostrar'
                });
            }

            return res.status(200).send({
                status: 'success',
                topics: topics.docs,
                totalDocs: topics.totalDocs,
                totalPages: topics.totalPages
            });
        });
    },
    getTopicsByUser: function(req, res) {

        var userId = req.params.user;
        Topic.find({
            user: userId
        })
        .sort([['date', 'descending']])
        .exec((err, topics) => {

            if(err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error en la petición'
                });
            }

            if(!topics){
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay temas para mostrar'
                });
            }

            return res.status(200).send({
                status: 'success',
                topics
            });

        });
    },
    getTopic: function(req, res) {

        var topicId = req.params.id;
        Topic.findById(topicId)
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
    },
    update: function(req, res) {

        var topicId = req.params.id;

        var params = req.body;
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);
        }catch(err){
            return res.status(200).send({
                message: 'Faltan datos por enviar'
            });
        }

        if(validate_title && validate_content && validate_lang) {

            var update = {
                title: params.title,
                content: params.content,
                code: params.code,
                lang: params.lang
            };

            Topic.findOneAndUpdate({_id: topicId, user: req.user.sub}, update, {new: true}, (err, topicUpdated) => {

                if(err){
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error en la petición'
                    });
                }

                if(!topicUpdated){
                    return res.status(404).send({
                        status: 'error',
                        message: 'No se ha podido actualizar el tema'
                    });
                }

                return res.status(200).send({
                    status: 'success',
                    topic: topicUpdated
                });
            });
    
            

        }else{
            return res.status(200).send({
                message: 'Error al validar los datos'
            });
        }    
    },
    delete: function(req, res) {

        var topicId = req.params.id;

        Topic.findOneAndDelete({_id: topicId, user: req.user.sub}, (err, topicRemoved) => {
            if(err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error en la petición'
                });
            }

            if(!topicRemoved) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha podido eliminar el tema'
                });
            }

            return res.status(200).send({
                status: 'success',
                topic: topicRemoved
            });
        });

       
    },
    search: function(req, res) {

        var search = req.params.search;

        Topic.find({ "$or": [
            {"title": {"$regex": search, "$options": "i"} },
            {"content": {"$regex": search, "$options": "i"} },
            {"code": {"$regex": search, "$options": "i"} },
            {"lang": {"$regex": search, "$options": "i"} }
        ]})
        .populate('user')
        .sort([['date', 'descending']])
        .exec((err, topics) => {

            if(err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error en la petición'
                });
            }

            if(!topics) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay temas disponibles'
                });
            }

            return res.status(200).send({
                status: 'success',
                topics
            });
        });
    }

};

module.exports = controller;