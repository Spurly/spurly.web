# Frontend Architecture

Spurly Web follows a **layered architecture** pattern similar to the backend, ensuring clean separation of concerns and maintainability.

## Architecture Layers

```
┌─────────────────────────────────────┐
│       React Components (UI)          │ ← Pages, Components
├─────────────────────────────────────┤
│   Context / Hooks (State Management) │ ← AuthContext, useAuth
├─────────────────────────────────────┤
│   Controllers (Business Logic)       │ ← authController
├─────────────────────────────────────┤
│   API Clients (Endpoint Handlers)    │ ← authApi
├─────────────────────────────────────┤
│   Gateway (HTTP Communication)       │ ← apiGateway
├─────────────────────────────────────┤
│   Entities (Data Models)             │ ← User, AuthResponse
├─────────────────────────────────────┤
│   Backend API (HTTP)                 │ ← spurly.backend
└─────────────────────────────────────┘
```

## Directory Structure

```
src/
├── pages/                    # Page components (full-screen views)
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   └── ...
│
├── components/               # Reusable UI components
│   ├── ProtectedRoute.jsx
│   ├── Header.jsx
│   └── ...
│
├── controllers/              # Business logic orchestrators
│   ├── authController.js     # Handles auth logic
│   └── ...
│
├── api/                      # API client implementations
│   ├── authApi.js            # Auth endpoints
│   └── ...
│
├── gateway/                  # HTTP communication layer
│   └── apiGateway.js         # Axios instance + interceptors
│
├── entities/                 # Data models / types
│   ├── User.js               # User model
│   └── ...
│
├── context/                  # React Context providers
│   └── AuthContext.jsx       # Global auth state
│
├── hooks/                    # Custom React hooks
│   └── useAuth.js            # Hook for auth context
│
└── utils/                    # Utility functions
    └── ...
```

## Layer Responsibilities

### 1. **Gateway Layer** (`apiGateway.js`)
- Central HTTP client using Axios
- Base URL configuration
- JWT token injection in request headers
- Error handling & response interception
- 401 redirect to login

```js
import apiGateway from '../gateway/apiGateway.js';

// Usage
const response = await apiGateway.get('/auth/me');
apiGateway.setToken(token);
```

### 2. **Entities Layer** (`entities/User.js`)
- Data models representing backend responses
- Type safety and structure consistency
- Methods for serialization/deserialization

```js
import { User, AuthResponse } from '../entities/User.js';

const user = User.fromResponse(data);
const token = authResponse.getToken();
```

### 3. **API Client Layer** (`api/authApi.js`)
- Endpoint-specific implementations
- Calls gateway for HTTP communication
- Wraps responses in Entities
- Error handling specific to each API

```js
import authApi from '../api/authApi.js';

const response = await authApi.login({ email, password });
```

### 4. **Controller Layer** (`controllers/authController.js`)
- Business logic orchestration
- Handles multi-step operations
- Manages local storage
- Bridges API layer and UI layer

```js
import authController from '../controllers/authController.js';

const { user, token } = await authController.login(email, password);
authController.isAuthenticated(); // Check auth status
```

### 5. **Context / State Layer** (`context/AuthContext.jsx`)
- Global application state
- Provides data to entire app
- Handles loading/error states

```js
const { user, login, logout, loading, error } = useAuth();
```

### 6. **UI Layer** (Components & Pages)
- React components
- Uses hooks for state access
- Dispatches actions to controllers

```jsx
const LoginPage = () => {
  const { login } = useAuth();
  await login(email, password);
};
```

## Data Flow

### Login Flow Example

```
1. User types email/password → LoginPage
   ↓
2. User clicks "Sign In" → LoginPage calls useAuth().login()
   ↓
3. login() → AuthContext → authController.login()
   ↓
4. authController.login() → authApi.login()
   ↓
5. authApi.login() → apiGateway.post('/auth/login')
   ↓
6. apiGateway → HTTP POST → Backend /api/auth/login
   ↓
7. Backend returns { success, data: { user, token }, status }
   ↓
8. authApi wraps response → AuthResponse entity
   ↓
9. authController stores token → apiGateway.setToken(token)
   ↓
10. authController stores user → localStorage
   ↓
11. AuthContext updates state → user, loading = false
   ↓
12. LoginPage reads user from context → redirect to /dashboard
```

## API Integration

### Adding a New Endpoint

#### Step 1: Define Entity (if needed)
```js
// src/entities/MyEntity.js
export class MyEntity {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
  }
  static fromResponse(data) {
    return new MyEntity(data);
  }
}
```

#### Step 2: Create API Client
```js
// src/api/myApi.js
import apiGateway from '../gateway/apiGateway.js';

class MyApi {
  async getItems() {
    const response = await apiGateway.get('/my-endpoint');
    return response.data.data.map(item => MyEntity.fromResponse(item));
  }
}

export default new MyApi();
```

#### Step 3: Create/Update Controller
```js
// src/controllers/myController.js
import myApi from '../api/myApi.js';

class MyController {
  async getItems() {
    return await myApi.getItems();
  }
}

export default new MyController();
```

#### Step 4: Use in Component
```jsx
// src/pages/MyPage.jsx
import myController from '../controllers/myController.js';

const MyPage = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    myController.getItems().then(setItems);
  }, []);

  return <div>{items.map(item => <div key={item.id}>{item.name}</div>)}</div>;
};
```

## Error Handling

### Global Error Handling (401 redirects)
```js
// In apiGateway.js
if (error.response?.status === 401) {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

### Specific Error Handling
```js
try {
  await authController.login(email, password);
} catch (err) {
  setError(err.message); // "Invalid credentials"
}
```

## Token Management

### Storing Token
```js
apiGateway.setToken(token);  // Stored in localStorage + headers
```

### Automatic Token Injection
```js
// Every request automatically includes:
// Authorization: Bearer <token>
```

### Token Removal
```js
apiGateway.removeToken();    // Removes from localStorage + headers
```

## Best Practices

1. **Always use controllers** - Never call API directly from components
2. **Entities for consistency** - Wrap API responses in entity classes
3. **Error messages in controllers** - Let controllers handle error formatting
4. **localStorage sparingly** - Only token and user basics
5. **Typed responses** - Use Entities for data structure
6. **Async/await** - Use promises, not callbacks
7. **Separation of concerns** - Each layer has one responsibility

## Testing

Each layer can be tested independently:

```js
// Test API layer
const result = await authApi.login({ email, password });

// Test Controller layer
const { user, token } = await authController.login(email, password);

// Test Context/Hook
const { login } = useAuth();
await login(email, password);
```
