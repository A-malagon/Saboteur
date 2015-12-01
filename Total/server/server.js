
var comprobarCredenciales = function(partidaId,jugadorId,carta){
    var p = Partidas.findOne({_id: partidaId});
    var c = Caracteristicas.findOne({partidaId: partidaId, jugadorId: jugadorId});

    if (p.turno != jugadorId){
        return false;
    }

    if(carta != null && c.mano.indexOf(carta) == -1){
        return false;
    }

    return true;
};

var descartarCarta = function(jugadorId, partidaId, carta){
    mano = Caracteristicas.findOne({jugadorId: jugadorId, partidaId: partidaId}).mano;
    posicionCarta = mano.indexOf(carta);
    mano.splice(posicionCarta,1);
    Caracteristicas.update({jugadorId: jugadorId, partidaId: partidaId},{$set:{mano: mano}});
}

var robarCarta = function(partidaId){
    mazo = Partidas.findOne({_id: partidaId}).mazo;
    carta = mazo[mazo.length -1];
    mazo.pop();
    Partidas.update({_id: partidaId},{$set:{mazo: mazo}});
    return carta;
};

var actualizarTurno = function(partidaId){
    var p = Partidas.findOne({_id: partidaId});
    jugadorId = p.turno;
    var index = (p.listJugadores.indexOf(Meteor.users.findOne({_id: jugadorId}).username) + 1) % p.numJugadores;
    var turno = Meteor.users.findOne({username: p.listJugadores[index]})._id;
    Partidas.update({_id: partidaId}, {$set:{mazo: mazo,turno: turno}});

}


Meteor.startup(function () {
    // code to run on server at startup
    Meteor.publish("partidas", function () {
        return Partidas.find();
    });

    Meteor.publish("caracteristicas", function () {
        return Caracteristicas.find();
    });


    Meteor.methods({
        removeAll: function(){
            Partidas.remove({});
            Caracteristicas.remove({});
        },

        nuevaPartida: function(username,titulo,numJugadores){
            if (! Partidas.findOne({titulo: titulo})) {
                Partidas.insert({
                  titulo: titulo,
                  numJugadores: numJugadores,
                  listJugadores: [username],
                  empezada: false
                });
            }
        },

        unirsePartida: function(partidaId,username){
            var p = Partidas.findOne({_id: partidaId});
            if (p.listJugadores.length < p.numJugadores){
                Partidas.update({_id: partidaId}, {$push: {listJugadores: username}});
            }
        },

        empezarPartida: function(partidaId){
            //Comienzo de Partida, Crear Mazo, Crear Tablero, Poner Turno y Propiedades de Jugadores
            configurarPartida(partidaId);
        },

        ponerCarta: function(partidaId,jugadorId,carta,row,col,nameObjetivo,objeto){
            //Comprobamos credenciales: es el turno de JugadorId y tiene la carta en la Mano.
            if (!comprobarCredenciales(partidaId,jugadorId,carta)){
              return false;
            }  
            //
            var r;
            switch(tiposCartas[carta].Type) {
              case "excavacion":
                r = ponerCamino(partidaId,jugadorId,carta,row,col);
                break;
              case "accionT":
                r = tiposCartas[carta].Funcion(partidaId,row,col);
                break;
              case "accionP":
                r = tiposCartas[carta].Funcion(partidaId,tiposCartas[carta],nameObjetivo,objeto);
                break;    
            }


            if(r != false){

                descartarCarta(jugadorId, partidaId,carta);
                robarCarta(partidaId);
                actualizarTurno(partidaId);
                /*
                //Variable Partida
                var p = Partidas.findOne({_id: partidaId});
                //Si se puede poner la carta la quitamos de la Mano.
                var mazo = p.mazo;
                var mano = Caracteristicas.findOne({partidaId: partidaId,jugadorId: jugadorId}).mano;
                mano.splice(mano.indexOf(carta),1);
                // Robamos carta
                mano.push(mazo[mazo.length-1]);
                mazo.splice(mazo.length-1,1);
                // Actualizamos la Mano del Jugador,el Mazo y el Turno
                var index = (p.listJugadores.indexOf(Meteor.users.findOne({_id: jugadorId}).username) + 1) % p.numJugadores;
                var turno = Meteor.users.findOne({username: p.listJugadores[index]})._id;
                Partidas.update({_id: partidaId}, {$set:{mazo: mazo,turno: turno}});
                Caracteristicas.update({partidaId: partidaId,jugadorId: jugadorId},{$set: {mano: mano}});
                */
            }

            return r;
        },

        descartarCarta: function(partidaId,jugadorId,carta){
            if (!comprobarCredenciales(partidaId,jugadorId,carta)){
              return false;
            } 
            descartarCarta(jugadorId, partidaId,carta);
            robarCarta(partidaId);
            actualizarTurno(partidaId);

            return true;
        },
    });
});
