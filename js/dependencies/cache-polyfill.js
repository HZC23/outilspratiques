/**
 * Cache Polyfill
 * Polyfill pour les méthodes add, addAll et match qui ne sont pas implémentées dans tous les navigateurs
 * Copyright 2014 Google Inc. Tous droits réservés.
 * Sous licence Apache License, Version 2.0
 */
(function() {
  // Fonction utilitaire pour convertir des URLs ou requêtes en objets Request
  function toRequest(url) {
    return new Request(url);
  }

  // Implémentation de Cache.add()
  Cache.prototype.add = function add(request) {
    return this.addAll([request]);
  };

  // Implémentation de Cache.addAll()
  Cache.prototype.addAll = function addAll(requests) {
    var cache = this;

    // Transformation en objets Request
    requests = requests.map(toRequest);

    // Création d'un processus séquentiel qui contient à la fois la récupération et la mise en cache
    return Promise.all(
      requests.map(function(request) {
        // Si le serveur répond par un code d'erreur, cette promesse sera rejetée
        return fetch(request.clone());
      })
    ).then(function(responses) {
      // Si l'une des récupérations échoue, cette promesse sera rejetée
      if (responses.some(function(response) {
        return !response.ok;
      })) {
        throw new Error('Au moins une ressource n\'a pas pu être récupérée');
      }

      // Ajouter toutes les réponses au cache
      return Promise.all(
        responses.map(function(response, i) {
          return cache.put(requests[i], response);
        })
      );
    });
  };

  // Implémenter si manquant
  if (!CacheStorage.prototype.match) {
    CacheStorage.prototype.match = function match(request, options) {
      var caches = this;
      
      return caches.keys().then(function(cacheNames) {
        var match;
        
        return cacheNames.reduce(function(chain, cacheName) {
          return chain.then(function() {
            return match || caches.open(cacheName).then(function(cache) {
              return cache.match(request, options);
            }).then(function(response) {
              match = response;
              return match;
            });
          });
        }, Promise.resolve());
      });
    };
  }
})(); 