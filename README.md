#  Backend - Gestion de Candidats

##  Description

API REST développée avec **Node.js, Express et TypeScript** permettant la gestion de candidats (CRUD + validation asynchrone).

---

##  Stack technique

* Node.js + Express
* TypeScript
* MongoDB (Mongoose)
* JWT (authentification)
* Zod (validation)
* Jest + Supertest (tests)
* k6 (tests de charge)

---

## Installation

### 1. Cloner le projet

```bash
git clone <repo-backend>
cd backend-gestion-candidat
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` :

```env
PORT=3000
MONGO_URI=VOTRE_MONGO_URI
JWT_SECRET=secret
```

### 4. Lancer le projet

```bash
npm run dev
```

---

## Endpoints API

 Méthode  Endpoint                      Description           
 POST     /api/auth/login               Authentification      
 POST     /api/candidates               Créer un candidat     
 GET      /api/candidates/:id          Récupérer             
 GET      /api/candidates/              Récupérer tous les candidats             
 PUT      /api/candidates/:id           Mise à jour           
 DELETE   /api/candidates/:id           Soft delete           
 POST    /api/candidates/:id/validate  Validation (2s delay) 

---

## Sécurité

* Authentification JWT
* Rate limiting (anti brute force)
* Validation stricte (Zod)
* Gestion des erreurs structurée

---

##  Stratégie de tests

### Tests unitaires

* Couverture sur services et modèles
* Objectif : ≥ 90%

###  Tests d’intégration

* Supertest + MongoMemoryServer
* Test complet des endpoints

###  Tests E2E (via frontend)

* Scénario complet :

  * Login
  * Création
  * Validation
  * Suppression

###  Tests de charge (k6)

#### Lancer le test :

```bash
k6 run load-test.js \
-e BASE_URL=https://backend-gestion-candidat.onrender.com/api \
-e TOKEN=YOUR_TOKEN
```


## Couverture de code

* Générée avec Jest

```bash
npm run test -- --coverage
```

---

##  Déploiement

* Hébergé sur Render
* Base MongoDB Atlas

---

##  Structure

```
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── middlewares/
 ├── utils/
 ├── services/
 └── server.ts
```

---

## Points forts

* Architecture scalable
* Gestion d’erreurs avancée
* Logs structurés
* Tests complets

---

## Lien API

👉 https://backend-gestion-candidat.onrender.com

---
