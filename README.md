# Planning Nemaucar

Application web de gestion quotidienne pour les locations Nemaucar.

## Ce que fait cette version

- sauvegarde des donnees dans le site Netlify,
- connexion par mot de passe,
- deconnexion,
- sauvegarde persistante des vehicules, locations, clients et statuts,
- export et import JSON,
- interface responsive ordinateur et tablette.

## Important sur la securite

Le mot de passe est protege cote serveur via les fonctions Netlify.

Cette solution est adaptee a un petit usage interne avec un mot de passe partage.
Si plus tard tu veux plusieurs comptes utilisateurs, il faudra evoluer vers une vraie gestion d'utilisateurs.

## Point important

`Netlify Drop` ne suffit pas pour cette version.

La connexion securisee et la sauvegarde serveur utilisent des fonctions Netlify avec dependances.
Pour que tout marche correctement, il faut passer par :

1. un depot GitHub
2. un site Netlify connecte a ce depot

## Methode la plus simple : GitHub puis Netlify

### 1. Creer le depot GitHub

1. Ouvrir GitHub.
2. Creer un nouveau depot, par exemple `planning-nemaucar`.
3. Laisser le depot vide au depart.

### 2. Envoyer le dossier actuel sur GitHub

La methode la plus simple, sans commandes :

1. ouvrir le nouveau depot GitHub,
2. cliquer sur `uploading an existing file`,
3. ouvrir le dossier `planning-nemaucar` sur ton ordinateur,
4. glisser tout le contenu du dossier dans GitHub,
5. cliquer sur `Commit changes`.

Important :

- il faut envoyer le contenu du dossier, pas seulement le ZIP,
- le dossier `netlify` doit etre present,
- le dossier `assets` doit etre present,
- `package.json` et `netlify.toml` doivent etre presents.

### 3. Connecter GitHub a Netlify

1. Dans Netlify, cliquer sur `Add new site` ou `Import an existing project`.
2. Choisir `GitHub`.
3. Autoriser GitHub si besoin.
4. Selectionner le depot `planning-nemaucar`.

Reglages conseilles :

- Build command : laisser vide
- Publish directory : `.`

### 4. Ajouter les variables d'environnement

Dans Netlify, ouvrir `Site configuration`, puis `Environment variables`.

Ajouter :

- `NEMAUCAR_APP_PASSWORD`
- `NEMAUCAR_SESSION_SECRET`

Exemple :

- `NEMAUCAR_APP_PASSWORD = Nemaucar2026`
- `NEMAUCAR_SESSION_SECRET = Nemaucar-Planning-Secret-2026-Change-Moi`

### 5. Lancer le premier deploy

Une fois le depot connecte et les variables ajoutees, Netlify lance le deploy.

Ensuite :

- la page de connexion apparait,
- le mot de passe fonctionne,
- la sauvegarde serveur fonctionne vraiment.

## Donnees reelles

La flotte de depart inclut maintenant tes vehicules reels.

Le bouton `Recharger la flotte` remet tout a zero :

- locations supprimees,
- clients supprimes,
- historique efface,
- flotte reinitialisee avec tes vehicules de base.

## Renommer le site Netlify

Pour changer l'adresse Netlify :

1. ouvrir le projet dans Netlify,
2. aller dans `Site configuration`,
3. ouvrir `General`,
4. chercher `Site details`,
5. cliquer sur `Change site name`.

Exemple :
`planning-nemaucar.netlify.app`

## Ajouter un nom de domaine

Pour utiliser ton propre domaine :

1. dans Netlify, ouvrir `Domain management`,
2. cliquer sur `Add a domain`,
3. saisir ton domaine,
4. suivre les indications DNS affichees par Netlify.

Exemples :

- `planning.nemaucar.com`
- `location.nemaucar.com`

## Local

Si tu ouvres simplement `index.html` hors Netlify, l'application peut encore fonctionner en mode local de secours.

Pour la vraie utilisation quotidienne, utilise la version GitHub + Netlify.
