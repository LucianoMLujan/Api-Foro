'use strict'

const { mongo } = require('mongoose');
var mongoose = require('mongoose');
var app = require('./app');
var port = process.env.port || 3999;

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/api_rest_node', { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('La conexion a la bd de mongo se realizo correctamente');

            //Crear el servidor
            app.listen(port, () => {
                console.log('El servidor esta corriendo correctamente http://localhost:3999 esta funcionando');
            });
        })
        .catch(error => console.log(error));