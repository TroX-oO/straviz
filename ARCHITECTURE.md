# Straviz — Architecture Technique

> Document de référence pour l'ajout de fonctionnalités futures.
> Destiné à être consommé par un LLM comme contexte de développement.

---

## 1. Vue d'ensemble du projet

**Straviz** est une Single Page Application (SPA) qui connecte un utilisateur à son compte Strava via OAuth 2.0 + PKCE et affiche ses données d'activités sportives (statistiques, graphiques, etc.).

| Propriété    | Valeur                        |
| ------------ | ----------------------------- |
| Type         | SPA (Single Page Application) |
| Langue       | TypeScript strict             |
| Build tool   | Vite 7                        |
| Framework UI | React 19                      |
| Port de dev  | 3000                          |

---

## 2. Stack technique complète

### 2.1 Production dependencies (`dependencies`)

| Bibliothèque       | Version  | Rôle                                                            |
| ------------------ | -------- | --------------------------------------------------------------- |
| `react`            | ^19.2.0  | Framework UI                                                    |
| `react-dom`        | ^19.2.0  | Rendu DOM React                                                 |
| `react-router-dom` | ^7.13.0  | Routage client (SPA)                                            |
| `@reduxjs/toolkit` | ^2.11.2  | Gestion d'état global (state management)                        |
| `react-redux`      | ^9.2.0   | Binding React ↔ Redux                                           |
| `@emotion/react`   | ^11.14.0 | CSS-in-JS : styles dynamiques, global styles, keyframes         |
| `@emotion/styled`  | ^11.14.1 | CSS-in-JS : composants stylés (`styled.div`, etc.)              |
| `axios`            | ^1.13.5  | Client HTTP utilisé pour les appels POST OAuth (token exchange) |
| `idb`              | ^8.0.3   | Wrapper IndexedDB (persistance locale des tokens et du profil)  |

### 2.2 Dev dependencies (`devDependencies`)

| Bibliothèque                  | Version    | Rôle                                                                        |
| ----------------------------- | ---------- | --------------------------------------------------------------------------- |
| `vite`                        | ^7.3.1     | Bundler / serveur de dev                                                    |
| `@vitejs/plugin-react`        | ^5.1.1     | Plugin Vite pour React + support Emotion (babel transform)                  |
| `@emotion/babel-plugin`       | _(latest)_ | Optimisation des styles Emotion à la compilation (noms lisibles, SSR ready) |
| `typescript`                  | ~5.9.3     | Typage statique                                                             |
| `eslint`                      | ^9.39.1    | Linter                                                                      |
| `typescript-eslint`           | ^8.48.0    | Règles ESLint spécifiques TypeScript                                        |
| `eslint-plugin-react-hooks`   | ^7.0.1     | Vérification des règles des Hooks React                                     |
| `eslint-plugin-react-refresh` | ^0.4.24    | Compatibilité Fast Refresh (HMR)                                            |
| `globals`                     | ^16.5.0    | Définitions de variables globales pour ESLint                               |
| `@types/node`                 | ^24.10.1   | Types Node.js                                                               |
| `@types/react`                | ^19.2.7    | Types React                                                                 |
| `@types/react-dom`            | ^19.2.3    | Types ReactDOM                                                              |

---

## 3. Structure des fichiers

```
src/
├── main.tsx                  # Point d'entrée — monte <Provider><App />
├── App.tsx                   # Racine : <ThemeProvider><AppRoutes />
├── AppRoutes.tsx             # Définition de toutes les routes
├── vite-env.d.ts             # Déclarations de types Vite (import.meta.env)
│
├── api/
│   └── strava.ts             # Couche API : OAuth authorize + exchangeToken
│
├── components/
│   └── ProtectedRoute.tsx    # Guard de route (redirige si non authentifié)
│
├── contexts/
│   └── ThemeContext.tsx      # ThemeProvider + React Context du thème
│
├── hooks/
│   ├── index.ts              # Barrel : exports publics des hooks
│   ├── useAuth.ts            # Lecture/écriture état auth depuis Redux
│   ├── useActivities.ts      # Fetch paginé des activités Strava
│   ├── useSettings.ts        # Paramètres utilisateur (localStorage)
│   ├── useStats.ts           # Fetch statistiques athlète + données graphiques
│   ├── useSync.ts            # Sync Strava → IndexedDB + stats de synchronisation
│   └── useStoredActivities.ts# Lecture seule des activités depuis IndexedDB
│
├── pages/
│   ├── Home.tsx              # Landing page publique (CTA OAuth)
│   ├── LoginPage.tsx         # Page de connexion (redirige vers Home si déjà auth)
│   ├── CallbackPage.tsx      # Callback OAuth : échange le code contre un token
│   ├── DashboardPage.tsx     # Dashboard principal : sidebar + onglets
│   └── dashboard/
│       ├── SyncTab.tsx       # Onglet Synchronisation (fetch Strava → IDB)
│       └── ActivitiesTab.tsx # Onglet Activités (lecture seule depuis IDB)
│
├── store/
│   ├── store.ts              # Configuration Redux store
│   └── slices/
│       └── authSlice.ts      # Slice Redux : état d'authentification
│
├── theme/
│   └── theme.ts              # Définition light/dark theme + type AppTheme
│
├── types/
│   └── index.ts              # Types TypeScript canoniques du domaine
│
└── utils/
    ├── pkce.ts               # Génération code verifier, code challenge, state OAuth
    └── storage.ts            # Abstraction IndexedDB (tokens, profil athlète)
```

---

## 4. Architecture applicative

### 4.1 Arbre de rendu

```
main.tsx
└── <Provider store={store}>          ← Redux store injecté globalement
    └── App.tsx
        └── <ThemeProvider>           ← Contexte thème (light/dark) + Emotion ThemeProvider
            └── <AppRoutes>           ← BrowserRouter + Routes
                ├── /                 → <Home>
                ├── /login            → <LoginPage>
                ├── /callback         → <CallbackPage>
                └── <ProtectedRoute>
                    └── /dashboard    → <DashboardPage>
                                           ├── <Sidebar> (nav : Synchronisation | Activités)
                                           ├── [activeTab='sync']       → <SyncTab>
                                           └── [activeTab='activities'] → <ActivitiesTab>
```

### 4.2 Redux Store

**Fichier** : `src/store/store.ts`

```typescript
configureStore({
  reducer: {
    auth: authReducer, // seul slice actif
  },
});

// Types exportés :
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
```

**authSlice** (`src/store/slices/authSlice.ts`) :

```typescript
// Shape de l'état
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null      // timestamp Unix (secondes)
  athlete: Athlete | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Actions exportées (utilisées dans le projet)
setTokens(payload: { accessToken, refreshToken, expiresAt, athlete? })
logout()
```

---

## 5. Flux d'authentification OAuth 2.0 + PKCE

```
1. Home.tsx
   └── onClick → authorize()           [src/api/strava.ts]
       ├── generateCodeVerifier()      → random base64url (32 bytes)
       ├── generateCodeChallenge()     → SHA-256(verifier) base64url
       ├── generateState()             → random base64url (16 bytes)
       ├── saveOAuthState(state)       → sessionStorage['oauth_state']
       ├── clearCodeVerifier()         → sessionStorage (nettoyage préalable)
       └── window.location.href = STRAVA_AUTH_URL + params

2. Strava Auth → redirect vers /callback?code=…

3. CallbackPage.tsx
   └── useEffect → exchangeToken(code)  [src/api/strava.ts]
       ├── POST https://www.strava.com/oauth/token
       │   { client_id, client_secret, code, grant_type: 'authorization_code' }
       ├── clearCodeVerifier() + clearOAuthState()
       ├── saveAuth({ accessToken, refreshToken, expiresAt })  → IndexedDB
       ├── store.dispatch(setTokens({ …, athlete }))           → Redux
       └── navigate('/dashboard')
```

**Variables d'environnement requises** (fichier `.env`) :

```
VITE_STRAVA_CLIENT_ID=…
VITE_STRAVA_CLIENT_SECRET=…
VITE_STRAVA_REDIRECT_URI=…   # ex: http://localhost:3000/callback
```

---

## 6. Persistance des données

Trois mécanismes de stockage coexistent selon le type de donnée :

| Donnée                                     | Mécanisme      | Clé / Store                      | Fichier                     |
| ------------------------------------------ | -------------- | -------------------------------- | --------------------------- |
| `accessToken`, `refreshToken`, `expiresAt` | IndexedDB      | store `auth`, key `"tokens"`     | `utils/storage.ts`          |
| Profil athlète (`Athlete`)                 | IndexedDB      | store `athlete`, key `"current"` | `utils/storage.ts`          |
| Code verifier PKCE                         | sessionStorage | `pkce_code_verifier`             | `utils/storage.ts`          |
| OAuth state                                | sessionStorage | `oauth_state`                    | `utils/storage.ts`          |
| Préférences utilisateur                    | localStorage   | `straviz_settings`               | `hooks/useSettings.ts`      |
| Thème actif                                | localStorage   | `theme`                          | `contexts/ThemeContext.tsx` |

**Schéma IndexedDB** (`StravizDB`) :

```typescript
{
  auth:       { key: string, value: { accessToken, refreshToken, expiresAt } }
  athlete:    { key: string, value: Athlete }
  activities: { key: number, value: Activity, indexes: { 'by-date': string } }  // ✅ ACTIF
  // Stores créés mais non utilisés : gear, settings, sync
}
```

**Fonctions `storage.ts` liées aux activités :**

```typescript
saveActivities(activities: Activity[]): Promise<void>
// Transaction atomique : vide le store puis insère toutes les activités
getActivitiesFromStorage(): Promise<Activity[]>
clearActivities(): Promise<void>
saveLastSync(timestamp: number): Promise<void> // clé 'lastSync' dans store 'sync'
getLastSync(): Promise<number | null>
```

---

## 7. Hooks publics

Tous accessibles via le barrel `src/hooks/index.ts`.

### `useAuth()`

**Fichier** : `src/hooks/useAuth.ts`

```typescript
// Retourne
{
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  athlete: Athlete | null
  login(tokens: { accessToken, refreshToken, expiresAt, athlete? }): void
  logout(): void
}
```

Lit depuis Redux `state.auth`. Dispatche `setTokens` et `logout`.

---

### `useActivities(page?, perPage?)`

**Fichier** : `src/hooks/useActivities.ts`

```typescript
// Paramètres
page: number = 1
perPage: number = 30

// Retourne
{
  activities: Activity[]
  totalActivities: number
  loading: boolean
  error: string | null
  refetch(): void
}
```

- Appel direct à `GET https://www.strava.com/api/v3/athlete/activities` via `fetch` natif
- Authentification via `Authorization: Bearer {accessToken}` (token lu depuis Redux)
- `fetchActivities` encapsulé dans `useCallback([page, perPage, accessToken])`
- Refetch automatique si `page`, `perPage` ou `accessToken` change

---

### `useStats()`

**Fichier** : `src/hooks/useStats.ts`

```typescript
// Retourne
{
  totalStats: TotalStats     // { totalDistance, totalMovingTime, totalElevation, totalActivities, activeDays }
  monthlyData: MonthlyData[] // { month: string (format "jan. 26"), distance, activities }[]
  activityTypeData: ActivityTypeData[] // { type, count, distance }[]
  loading: boolean
  error: string | null
  refetch(): void
}
```

Enchaîne 3 appels Strava :

1. `GET /athlete` — identifiant athlète
2. `GET /athletes/{id}/stats` — totaux lifetime (ride, run, swim)
3. `GET /athlete/activities?per_page=200` — activités récentes pour graphiques

- `fetchStats` encapsulé dans `useCallback([accessToken])`
- Les 12 derniers mois calculés localement à partir des activités

---

### `useSettings()`

**Fichier** : `src/hooks/useSettings.ts`

```typescript
// Shape Settings
{
  units: 'metric' | 'imperial'
  theme: 'light' | 'dark'
  language: string             // défaut 'fr'
  defaultActivityType: string  // défaut 'all'
  showPrivateActivities: boolean
  mapStyle: string             // défaut 'streets'
}

// Retourne
{
  settings: Settings
  units: Units
  theme: ThemeMode
  loading: boolean
  updateSettings(patch: Partial<Settings>): void
  resetSettings(): void
}
```

Persisté dans `localStorage['straviz_settings']` (JSON).

---

### `useSync()`

**Fichier** : `src/hooks/useSync.ts`

```typescript
// Retourne
{
  syncing:  boolean          // true pendant la pagination Strava
  progress: number           // nombre d'activités récupérées jusqu'ici
  error:    string | null
  stats: {
    lastSync:          number | null  // timestamp ms de la dernière sync
    totalCached:       number         // nb d'activités dans IDB
    activitiesByYear:  { year: string; count: number }[]
  }
  sync(): Promise<void>      // déclenche la synchronisation
}
```

- Pagination de `GET /athlete/activities` (100 activités/page, délai 100 ms entre pages)
- `while(true)` : s'arrête quand la page est vide ou `batch.length < PER_PAGE`
- Sauvegarde via `saveActivities()` (une transaction IDB atomique)
- Lit `lastSync` + `totalCached` au montage via `loadStats()`

---

### `useStoredActivities()`

**Fichier** : `src/hooks/useStoredActivities.ts`

```typescript
// Retourne
{
  activities: Activity[]
  loading:    boolean
  loaded:     boolean    // true après le premier appel réussi à load()
  load(): Promise<void>  // déclenche la lecture depuis IDB
}
```

- **Pas d'appel réseau** — lecture exclusive depuis IndexedDB
- Tri par `start_date` descendant appliqué après lecture
- Flag `loaded` pour éviter les double-lectures

---

## 8. Système de thème

### ThemeContext (`src/contexts/ThemeContext.tsx`)

```typescript
// API du contexte
{
  mode: 'light' | 'dark'
  theme: AppTheme              // objet theme complet
  toggleTheme(): void
  setTheme(mode: ThemeMode): void
}
```

- Détecte `prefers-color-scheme` au premier chargement
- Persiste le choix dans `localStorage['theme']`
- Applique la classe CSS `light` ou `dark` sur `<html>`
- Injecte les styles globaux via `<Global styles={...} />` d'Emotion (reset CSS, body, liens)
- Expose le thème à Emotion via `<EmotionThemeProvider theme={theme}>`

### Structure du thème (`src/theme/theme.ts`)

```typescript
// Type AppTheme = typeof lightTheme
{
  colors: {
    primary:    { main, light, dark, contrastText }  // orange Strava #fc4c02
    secondary:  { main, light, dark, contrastText }
    background: { default, paper }
    text:       { primary, secondary }
    error: string
    success: string
    warning: string
  }
  spacing: (factor: number) => string   // factor * 8px
  borderRadius: string                  // '8px'
  shadows: { small, medium, large }
  transitions: { default }              // '0.3s ease'
}
```

Deux variantes : `lightTheme` (fond clair) et `darkTheme` (fond `#0a0a0a`).

---

## 9. Routage

**Fichier** : `src/AppRoutes.tsx`  
**Library** : React Router DOM v7 (mode `BrowserRouter`)

| Path         | Composant       | Protection                                  |
| ------------ | --------------- | ------------------------------------------- |
| `/`          | `Home`          | Public                                      |
| `/login`     | `LoginPage`     | Public (redirige vers `/dashboard` si auth) |
| `/callback`  | `CallbackPage`  | Public                                      |
| `/dashboard` | `DashboardPage` | **Protégé** (`ProtectedRoute`)              |

**ProtectedRoute** (`src/components/ProtectedRoute.tsx`) : lit `isAuthenticated` depuis `useAuth()`, redirige vers `/login` si `false`, sinon rend `<Outlet>`.

Routes commentées prévues : `/activities`, `/analytics`, `/gear`, `/settings`.

---

## 10. Appels API Strava

**Base URL** : `https://www.strava.com/api/v3`  
**Auth URL** : `https://www.strava.com/oauth/authorize`  
**Token URL** : `https://www.strava.com/oauth/token`

Tous les appels aux endpoints `/api/v3` utilisent `fetch` natif avec le header :

```
Authorization: Bearer {accessToken}
```

| Endpoint                                     | Hook            | Description                            |
| -------------------------------------------- | --------------- | -------------------------------------- |
| `GET /athlete`                               | `useStats`      | Profil athlète (id, nom, prénom)       |
| `GET /athletes/{id}/stats`                   | `useStats`      | Totaux lifetime (ride, run, swim)      |
| `GET /athlete/activities?page=&per_page=`    | `useActivities` | Liste paginée d'activités (temps réel) |
| `GET /athlete/activities?page=&per_page=100` | `useSync`       | Sync complète paginée → IndexedDB      |
| `POST /oauth/token`                          | `api/strava.ts` | Échange code → tokens                  |

> Les appels passent en direct depuis le navigateur (client-side). Il n'y a pas de backend proxy.

---

## 11. Types canoniques (`src/types/index.ts`)

```typescript
Athlete; // Profil complet utilisateur Strava
Gear; // Vélo ou chaussure
Activity; // Activité sportive (propriétés Strava complètes)
ActivityMap; // Carte polyline d'une activité
ActivityType; // Union type de tous les sports Strava (AlpineSki, Ride, Run, …)
TokenResponse; // Réponse POST /oauth/token
AuthState; // Shape du state Redux auth
```

Ces types sont la source de vérité pour tout le projet.
Les hooks peuvent définir des sous-ensembles typés localement si besoin.

---

## 12. Configuration de build

### `vite.config.ts`

```typescript
{
  plugins: [
    react({
      jsxImportSource: '@emotion/react',   // active le JSX pragma Emotion (css prop)
      babel: {
        plugins: ['@emotion/babel-plugin'] // noms de classes lisibles + optimisation
      }
    })
  ],
  resolve: {
    alias: { '@': '/src' }    // import '@/components/...' disponible
  },
  server: { port: 3000 }
}
```

### TypeScript

- `tsconfig.app.json` — config pour les sources `src/`
- `tsconfig.node.json` — config pour `vite.config.ts`
- `tsconfig.json` — références vers les deux configs ci-dessus

### ESLint (`eslint.config.js`)

Règles actives :

- `@typescript-eslint/recommended` — règles TS strictes (no-any, no-unused-vars…)
- `eslint-plugin-react-hooks` — exhaustive-deps sur useEffect/useCallback
- `eslint-plugin-react-refresh` — un seul composant par fichier pour le HMR

---

## 13. Conventions de code

| Convention | Détail                                                                               |
| ---------- | ------------------------------------------------------------------------------------ |
| Style      | CSS-in-JS uniquement via `@emotion/styled` — **pas de fichiers `.css`**              |
| Composants | PascalCase, fichiers `.tsx`                                                          |
| Hooks      | camelCase préfixé `use`, fichiers `.ts`                                              |
| Exports    | Named exports uniquement (pas de `export default` sur les hooks/slices)              |
| Types      | Importés avec `import type` quand possible                                           |
| Fetch      | `fetch` natif pour les appels Strava API ; `axios` uniquement pour le token exchange |
| Alias      | `@/` → `src/` disponible dans les imports                                            |

---

## 14. Points d'extension identifiés

Les éléments suivants n'existent pas encore mais sont prévus ou naturellement intégrables dans l'architecture actuelle :

1. ~~**`/activities`** — Liste filtrée/triée des activités~~ ✅ **Implémenté** dans l'onglet _Activités_ du dashboard (`ActivitiesTab.tsx`)
2. **`/analytics`** — Graphiques avancés (données disponibles via `useStats`)
3. **`/gear`** — Liste vélos/chaussures (type `Gear` défini, store IDB `gear` créé)
4. **`/settings`** — Interface pour `useSettings` (structure déjà complète)
5. ~~**Persistance activités offline**~~ ✅ **Implémenté** — store IDB `activities` actif, `useSync`/`useStoredActivities` opérationnels
6. **Refresh automatique des tokens** — La logique `expiresAt` est dans Redux ; un intercepteur axios ou un check dans les hooks suffit
7. **Nouveaux slices Redux** — `configureStore` est prêt à recevoir d'autres reducers (`activities`, `gear`, `settings`)
8. **Cartes** — Le type `ActivityMap` (polyline Strava) est défini ; une bibliothèque map (Leaflet, Mapbox) peut être branchée
