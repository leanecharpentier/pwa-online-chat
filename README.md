# PWA Online Chat

Une application de chat en temps réel progressive (PWA) développée avec Next.js, React et Socket.io. Cette application offre une expérience de messagerie moderne avec support hors ligne, notifications push, capture de photos, et bien plus encore.

## 📋 Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités détaillées](#fonctionnalités-détaillées)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Contributions](#contributions)

## 🎯 Aperçu

PWA Online Chat est une application web progressive qui permet aux utilisateurs de communiquer en temps réel via des salles de chat. L'application est conçue pour fonctionner de manière optimale même en mode hors ligne, avec synchronisation automatique des messages lorsque la connexion est rétablie.

### Caractéristiques principales

- ✅ Chat en temps réel avec Socket.io
- ✅ Mode hors ligne avec synchronisation automatique
- ✅ Notifications push (Web Push API)
- ✅ Capture et partage de photos
- ✅ Galerie de photos intégrée
- ✅ Gestion des salles de chat multiples
- ✅ Interface utilisateur moderne et responsive
- ✅ Installation en tant qu'application (PWA)

## ✨ Fonctionnalités

### 1. Authentification et profil utilisateur

- **Connexion simple** : Les utilisateurs peuvent se connecter avec un nom d'utilisateur
- **Photo de profil** : Possibilité d'uploader une photo de profil personnalisée
- **Persistance** : Les informations utilisateur sont sauvegardées dans le localStorage
- **Protection des routes** : Les pages protégées nécessitent une authentification

### 2. Chat en temps réel

- **Salles de chat multiples** : Création et participation à plusieurs salles de conversation
- **Messages en temps réel** : Communication instantanée via Socket.io
- **Recherche de salles** : Fonction de recherche pour trouver rapidement une conversation
- **Indicateur de statut** : Affichage du statut en ligne/hors ligne
- **Historique des messages** : Conservation et affichage de l'historique des conversations

### 3. Gestion hors ligne

- **Mode hors ligne** : L'application fonctionne sans connexion Internet
- **Messages en attente** : Les messages sont stockés localement lorsqu'ils ne peuvent pas être envoyés
- **Synchronisation automatique** : Envoi automatique des messages en attente lors de la reconnexion
- **Indicateur visuel** : Affichage clair du statut de connexion

### 4. Partage de médias

- **Capture de photos** : Prise de photos directement depuis l'application (via la caméra)
- **Sélection depuis la galerie** : Choix de photos existantes depuis la galerie
- **Envoi d'images** : Partage d'images dans les conversations
- **Galerie personnelle** : Stockage et gestion des photos capturées
- **Visualisation** : Modal pour visualiser les photos en grand format

### 5. Notifications push

- **Abonnement aux notifications** : Les utilisateurs peuvent s'abonner aux notifications push
- **Notifications en temps réel** : Réception de notifications lors de nouveaux messages
- **Gestion des abonnements** : Possibilité de s'abonner/désabonner
- **Support multi-navigateurs** : Compatible avec les navigateurs modernes

### 6. Fonctionnalités avancées

- **Informations système** : Partage du niveau de batterie et de la localisation
- **Service Worker** : Cache des ressources pour une meilleure performance
- **Installation PWA** : Possibilité d'installer l'application sur l'écran d'accueil
- **Interface responsive** : Adaptation à tous les types d'écrans

## 🛠 Technologies utilisées

### Frontend

- **Next.js 15.5.9** : Framework React avec Server-Side Rendering
- **React 19.1.0** : Bibliothèque UI
- **TypeScript 5** : Typage statique
- **Tailwind CSS 4** : Framework CSS utilitaire
- **Radix UI** : Composants UI accessibles
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-label`
  - `@radix-ui/react-slot`
- **Lucide React** : Icônes modernes
- **Socket.io Client 4.8.1** : Client WebSocket pour la communication en temps réel

### Backend & Services

- **Socket.io Server** : Serveur WebSocket (hébergé sur `https://api.tools.gavago.fr`)
- **Web Push API** : Notifications push côté serveur
- **Service Worker** : Gestion du cache et des notifications push

### Outils de développement

- **ESLint** : Linter JavaScript/TypeScript
- **Prettier** : Formateur de code
- **Turbopack** : Bundler rapide pour le développement

## 🏗 Architecture

### Structure générale

L'application suit une architecture modulaire basée sur Next.js avec :

- **Pages** : Routes de l'application (App Router de Next.js)
- **Composants** : Composants React réutilisables
- **Contextes** : Gestion d'état globale (Auth, Socket)
- **Hooks personnalisés** : Logique métier réutilisable
- **Librairies** : Utilitaires et helpers
- **Types** : Définitions TypeScript

### Flux de données

```
Utilisateur → Composant → Hook → Context → Socket.io → Serveur
                ↓
           localStorage (hors ligne)
```

### Gestion d'état

- **AuthContext** : Gestion de l'authentification utilisateur
- **SocketContext** : Gestion de la connexion WebSocket
- **localStorage** : Persistance des données utilisateur et messages en attente
- **IndexedDB** : Stockage des photos (via le hook `usePhotoStorage`)

## 📦 Installation

### Prérequis

- Node.js 18+ (recommandé : Node.js 20+)
- npm ou yarn
- Un serveur Socket.io (ou utiliser celui fourni)

### Étapes d'installation

1. **Cloner le dépôt**

```bash
git clone <url-du-depot>
cd pwa-online-chat
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Lancer l'application en développement**

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Mode HTTPS (pour tester les notifications push)

Les notifications push nécessitent HTTPS. Pour tester en local :

```bash
npm run dev-https
```

## ⚙️ Configuration

### Configuration Next.js

Le fichier `next.config.ts` configure :

- **Headers de sécurité** : Protection XSS, clickjacking, etc.
- **Service Worker** : Configuration du cache et des headers CSP
- **Optimisations** : Configuration pour la production

## 🚀 Utilisation

### Première utilisation

1. **Accéder à l'application** : Ouvrez `http://localhost:3000` dans votre navigateur
2. **Se connecter** : Rendez-vous sur la page de connexion (`/connexion`)
3. **Créer un profil** :
   - Entrez un nom d'utilisateur
   - Uploadez une photo de profil (optionnel)
   - Cliquez sur "Se connecter"
4. **Accéder au chat** : Vous serez redirigé vers la page de chat (`/chat`)

### Utilisation du chat

1. **Créer une salle** : Cliquez sur le bouton "+" pour créer une nouvelle salle de chat
2. **Rejoindre une salle** : Cliquez sur une salle dans la liste pour la rejoindre
3. **Envoyer un message** : Tapez votre message et appuyez sur Entrée ou cliquez sur "Envoyer"
4. **Partager une photo** :
   - Cliquez sur l'icône caméra pour prendre une photo
   - Cliquez sur l'icône galerie pour sélectionner une photo existante
5. **Rechercher une salle** : Utilisez la barre de recherche pour filtrer les salles

### Galerie de photos

1. **Accéder à la galerie** : Cliquez sur "Galerie" dans la navigation
2. **Prendre une photo** : Cliquez sur "Prendre une photo" pour capturer une nouvelle image
3. **Visualiser une photo** : Cliquez sur une photo pour l'agrandir
4. **Supprimer une photo** : Dans la vue agrandie, cliquez sur "Supprimer"

### Notifications push

1. **S'abonner** : Sur la page d'accueil (`/`), cliquez sur "Subscribe"
2. **Tester** : Entrez un message et cliquez sur "Send Test"
3. **Se désabonner** : Cliquez sur "Unsubscribe" pour arrêter les notifications

### Installation PWA

1. **Sur Chrome/Edge** : Cliquez sur l'icône d'installation dans la barre d'adresse
2. **Sur iOS** : Utilisez le bouton de partage et sélectionnez "Ajouter à l'écran d'accueil"
3. **Sur Android** : Suivez les instructions du navigateur

## 📁 Structure du projet

```
pwa-online-chat/
├── .github/
│   └── workflows/
│       └── ci.yml              # Configuration CI/CD
├── public/
│   ├── sw.js                    # Service Worker
│   └── *.svg                    # Assets statiques
├── src/
│   ├── app/
│   │   ├── actions.ts           # Server Actions (notifications push)
│   │   ├── chat/
│   │   │   └── page.tsx         # Page principale du chat
│   │   ├── connexion/
│   │   │   └── page.tsx         # Page de connexion
│   │   ├── gallery/
│   │   │   └── page.tsx         # Page galerie
│   │   ├── layout.tsx           # Layout principal
│   │   ├── manifest.ts          # Manifest PWA
│   │   ├── page.tsx             # Page d'accueil (notifications)
│   │   └── globals.css          # Styles globaux
│   ├── components/
│   │   ├── chat/                # Composants spécifiques au chat
│   │   │   ├── CreateRoomModal.tsx
│   │   │   ├── GallerySelector.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── RoomItem.tsx
│   │   │   └── RoomList.tsx
│   │   ├── gallery/             # Composants de la galerie
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── PhotoGridItem.tsx
│   │   │   └── PhotoModal.tsx
│   │   ├── ui/                  # Composants UI réutilisables
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── label.tsx
│   │   ├── CameraModal.tsx      # Modal de capture photo
│   │   ├── Modal.tsx            # Modal générique
│   │   ├── Navigation.tsx        # Barre de navigation
│   │   └── ProtectedRoute.tsx   # Protection des routes
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Contexte d'authentification
│   │   └── SocketContext.tsx    # Contexte Socket.io
│   ├── hooks/
│   │   ├── useCamera.ts         # Hook pour la caméra
│   │   ├── useDeviceFeatures.ts # Hook pour batterie/localisation
│   │   ├── useMessages.ts       # Hook pour la gestion des messages
│   │   ├── useNotifications.ts  # Hook pour les notifications
│   │   ├── useNotificationSettings.ts
│   │   ├── useOffline.ts        # Hook pour le mode hors ligne
│   │   ├── usePhotoCapture.ts   # Hook pour la capture photo
│   │   ├── usePhotoStorage.ts   # Hook pour le stockage photos
│   │   └── useRooms.ts          # Hook pour les salles
│   ├── lib/
│   │   ├── api.ts               # Client API REST
│   │   ├── errors.ts            # Gestion des erreurs
│   │   ├── imageUtils.ts        # Utilitaires images
│   │   ├── logger.ts            # Système de logging
│   │   ├── photoStorage.ts      # Stockage des photos
│   │   └── utils.ts             # Utilitaires généraux
│   └── types/
│       └── index.ts             # Définitions TypeScript
├── .env.local                   # Variables d'environnement (à créer)
├── .gitignore
├── components.json              # Configuration shadcn/ui
├── eslint.config.mjs           # Configuration ESLint
├── next.config.ts              # Configuration Next.js
├── package.json                # Dépendances et scripts
├── postcss.config.mjs          # Configuration PostCSS
├── prettierrc                  # Configuration Prettier
└── tsconfig.json               # Configuration TypeScript
```

## 🔍 Fonctionnalités détaillées

### Système d'authentification

Le système d'authentification est simple et basé sur le localStorage :

- **Stockage** : Nom d'utilisateur et photo de profil dans `localStorage`
- **Persistance** : Les données sont conservées entre les sessions
- **Protection** : Le composant `ProtectedRoute` redirige vers `/connexion` si non authentifié

### Communication en temps réel

L'application utilise Socket.io pour la communication en temps réel :

- **Connexion** : Connexion automatique au serveur Socket.io au démarrage
- **Salles** : Les utilisateurs peuvent rejoindre plusieurs salles
- **Messages** : Envoi et réception de messages en temps réel
- **Images** : Partage d'images via Socket.io avec stockage sur le serveur

### Gestion hors ligne

Le système hors ligne utilise plusieurs mécanismes :

- **Détection** : Écoute des événements `online`/`offline` du navigateur
- **Stockage** : Messages en attente stockés dans `localStorage`
- **Synchronisation** : Envoi automatique lors de la reconnexion
- **Indicateurs** : Affichage visuel du statut de connexion

### Capture et stockage de photos

- **Capture** : Utilisation de l'API `getUserMedia` pour accéder à la caméra
- **Stockage local** : Photos sauvegardées dans IndexedDB via le hook `usePhotoStorage`
- **Upload serveur** : Images partagées dans le chat sont uploadées sur le serveur
- **Galerie** : Interface dédiée pour visualiser et gérer les photos

### Notifications push

Les notifications push utilisent le standard Web Push :

- **Service Worker** : Gestion des notifications dans `public/sw.js`
- **VAPID** : Authentification via clés VAPID
- **Abonnements** : Stockage des abonnements côté serveur
- **Envoi** : Server Actions pour envoyer des notifications

## 🛠 Développement

### Scripts disponibles

```bash
# Développement avec Turbopack
npm run dev

# Développement avec HTTPS (pour tester les notifications push)
npm run dev-https

# Build de production
npm run build

# Démarrer en mode production
npm start

# Linter
npm run lint

# Linter avec correction automatique
npm run lint:fix

# Formater le code
npm run format

# Vérifier le formatage
npm run format:check
```

### Conventions de code

- **TypeScript** : Utilisation stricte de TypeScript
- **ESLint** : Respect des règles ESLint configurées
- **Prettier** : Formatage automatique du code
- **Composants** : Structure modulaire et réutilisable
- **Hooks** : Logique métier dans des hooks personnalisés

### Ajout de nouvelles fonctionnalités

1. **Nouveau composant** : Créer dans `src/components/`
2. **Nouveau hook** : Créer dans `src/hooks/`
3. **Nouvelle page** : Créer dans `src/app/`
4. **Nouveau type** : Ajouter dans `src/types/index.ts`

## 🚢 Déploiement

### Build de production

```bash
npm run build
```

### Déploiement sur Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel
3. Déployez automatiquement à chaque push

### Déploiement sur d'autres plateformes

L'application Next.js peut être déployée sur :
- **Vercel** (recommandé)
- **Netlify**
- **AWS Amplify**
- **Docker** (avec `npm run build` puis `npm start`)

### Configuration HTTPS

Les notifications push nécessitent HTTPS en production. Assurez-vous que :
- Votre domaine a un certificat SSL valide
- Les variables d'environnement VAPID sont configurées
- Le Service Worker est accessible via HTTPS

## 🤝 Contributions

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Guidelines

- Suivez les conventions de code existantes
- Ajoutez des tests si possible
- Documentez les nouvelles fonctionnalités
- Assurez-vous que le linter passe

## 📝 Licence

Ce projet est privé. Tous droits réservés.

## 👤 Auteur

**Léane Charpentier**
- Email: leanecharpentierpro@outlook.com

## 🙏 Remerciements

- Next.js pour le framework
- Socket.io pour la communication en temps réel
- Radix UI pour les composants accessibles
- La communauté open source pour les outils et bibliothèques

---

**Note** : Cette application est en développement actif. Certaines fonctionnalités peuvent évoluer ou être améliorées.
