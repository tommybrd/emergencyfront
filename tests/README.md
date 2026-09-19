# Vérifications

Exécuter `node scripts/check.mjs` avec Node.js 24. Aucune installation npm n'est nécessaire.

La suite contrôle les ressources du site puis 20 scénarios : catalogue et répartitions, localisation des incidents, circulation, départs et retours de la flotte, victimes et transport au CH, sauvetage nautique, infirmier, lances et eau, profil du chef, domicile de nuit, renforts SPV et prochain appel.

Les scénarios utilisent la géométrie Three.js réelle avec un remplacement du DOM et du rendu WebGL. Ils ne mesurent pas les FPS et ne remplacent pas un contrôle visuel. Pour quatre ambulances simultanées : `TEST_VSAVS=4 node --experimental-loader ./tests/runtime-loader.mjs tests/ambulance-mission.mjs`.

Le fichier autonome est également contrôlé : intégrité des modules, sons intégrés, syntaxe, crédits et une mission de deux VSAV exécutée depuis ses modules embarqués, jusqu'au dépôt au CH et au retour. La caméra et le rendu sont remplacés pour ce test automatique.
