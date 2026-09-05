# Projet Web SIG - Département de Diourbel

Application de cartographie web réalisée à partir du sujet « Projet Cartographie en ligne 2024-2025 ».

## Résultat déjà préparé

- département : Diourbel ;
- centre de la carte : latitude `14.768905`, longitude `-16.216307` ;
- limites : 1 département et 2 arrondissements ;
- contenu : 384 localités, 177 tronçons routiers et 57 écoles ;
- projection web : WGS 84 (`EPSG:4326`) ;
- fonctions : onglets Accueil, À propos, Catalogue, Géocodage et Téléchargement, activation des couches, deux fonds de carte, recherche, recentrage, légende, échelle, coordonnées et fenêtres d'information ;
- chargement direct des cinq fichiers GeoJSON avec `fetch`, comme sur un hébergement GitHub Pages.

## Ce que demandait exactement le sujet

1. Extraire, à l'intérieur du département affecté, les limites départementales, les arrondissements, les localités, les routes et les écoles (`3 points`).
2. Convertir ces couches en GeoJSON dans QGIS et les placer dans le dossier `data` (`3 points`).
3. Activer les scripts des couches dans `index.html` (`2 points`).
4. Régler le centre et le zoom de la carte (`3 points`).
5. Indiquer le département, le nom de l'auteur et l'année (`3 points`).
6. Ajouter des fonctions utiles (`3 points`).
7. Publier sur GitHub et envoyer le lien par e-mail (`3 points`).

## Fichiers importants

- `index.html` : structure de l'application et textes affichés ;
- `css/app.css` : présentation de l'interface ;
- `js/app.js` : carte, styles des couches et interactions ;
- `data/*.geojson` : fichiers GeoJSON correspondant aux cinq thèmes demandés ;
- `data/*.geojson` : les cinq couches réellement chargées par l'application.

## Personnalisation obligatoire avant remise

Dans `index.html`, remplacer **« Nom à compléter »** par le nom de l'étudiant. Vérifier également l'année et l'intitulé de la promotion.

Les écoles ont été obtenues directement depuis OpenStreetMap, puis filtrées par la limite du département. Pour reproduire strictement la méthode indiquée dans le sujet, on peut aussi ouvrir `gis_osm_pois_free.shp` dans QGIS, sélectionner `fclass = 'school'`, puis découper le résultat avec la couche du département de Diourbel.

## Ouvrir l'application

Sous Windows, double-cliquer sur `ouvrir_carte.bat` : le serveur local démarre et la carte s'ouvre automatiquement. On peut aussi ouvrir le dossier avec l'extension **Live Server** de Visual Studio Code. Une connexion Internet est nécessaire pour le fond OpenStreetMap ; les cinq couches GeoJSON restent contenues dans le projet.

## Publier sur GitHub Pages

1. Créer un dépôt GitHub, par exemple `websig-diourbel`.
2. Ajouter tout le contenu de ce dossier à la racine du dépôt.
3. Dans les paramètres du dépôt, ouvrir **Pages**.
4. Choisir la branche principale et le dossier racine, puis enregistrer.
5. Attendre l'apparition de l'adresse publique, tester toutes les couches, puis transmettre ce lien selon les consignes de l'enseignant.

## Sources

- limites, arrondissements, localités et routes : données déjà présentes dans le projet QGIS/qgis2web du cours ;
- écoles : contributeurs OpenStreetMap, extraction du 5 septembre 2026 ;
- bibliothèque cartographique : Leaflet.
