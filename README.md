This app started as a plain vanilla React app created with "npx create-react-app"
I then used the tutorial from Auth0 to layer on login security.

(used to be in my Google Docs, now I've transcribed the whole thing into this doc))

#### In the Beginning

- npx create-react-app my-app
- cd my-app
- npm install react-router-dom @auth0/auth0-spa-js
- npm start (just to test it)
- cd src
- mkdir utils
- Create history.js (got rid of this later by switching from <Router> to <HashRouter>)

```jsx
// src/utils/history.js

import { createBrowserHistory } from "history";
export default createBrowserHistory();
```

### Create custom hooks

- Create src/react-auth-spa.js (slimmed down later)

NOTE: This is a set of custom React hooks that enable you to work with the Auth0 SDK in a more idiomatic way, providing functions that allow the user to log in, log out, and information such as whether the user is logged in

```jsx
// src/react-auth0-spa.js
import React, { useState, useEffect, useContext } from "react";
import createAuth0Client from "@auth0/auth0-spa-js";

const DEFAULT_REDIRECT_CALLBACK = () => window.history.replaceState({}, document.title, window.location.pathname);

export const Auth0Context = React.createContext();
export const useAuth0 = () => useContext(Auth0Context);
export const Auth0Provider = ({ children, onRedirectCallback = DEFAULT_REDIRECT_CALLBACK, ...initOptions }) => {
  const [isAuthenticated, setIsAuthenticated] = useState();
  const [user, setUser] = useState();
  const [auth0Client, setAuth0] = useState();
  const [loading, setLoading] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const initAuth0 = async () => {
      const auth0FromHook = await createAuth0Client(initOptions);
      setAuth0(auth0FromHook);

      if (window.location.search.includes("code=")) {
        const { appState } = await auth0FromHook.handleRedirectCallback();
        onRedirectCallback(appState);
      }

      const isAuthenticated = await auth0FromHook.isAuthenticated();

      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const user = await auth0FromHook.getUser();
        setUser(user);
      }

      setLoading(false);
    };
    initAuth0();
    // eslint-disable-next-line
  }, []);

  const loginWithPopup = async (params = {}) => {
    setPopupOpen(true);
    try {
      await auth0Client.loginWithPopup(params);
    } catch (error) {
      console.error(error);
    } finally {
      setPopupOpen(false);
    }
    const user = await auth0Client.getUser();
    setUser(user);
    setIsAuthenticated(true);
  };

  const handleRedirectCallback = async () => {
    setLoading(true);
    await auth0Client.handleRedirectCallback();
    const user = await auth0Client.getUser();
    setLoading(false);
    setIsAuthenticated(true);
    setUser(user);
  };
  return (
    <Auth0Context.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        popupOpen,
        loginWithPopup,
        handleRedirectCallback,
        getIdTokenClaims: (...p) => auth0Client.getIdTokenClaims(...p),
        loginWithRedirect: (...p) => auth0Client.loginWithRedirect(...p),
        getTokenSilently: (...p) => auth0Client.getTokenSilently(...p),
        getTokenWithPopup: (...p) => auth0Client.getTokenWithPopup(...p),
        logout: (...p) => auth0Client.logout(...p)
      }}>
      {children}
    </Auth0Context.Provider>
  );
};
```

## Create NavBar

- Create directory src/components
- Create src/components/NavBar.js

NOTE: This component will show the login and logout buttons

```jsx
// src/components/NavBar.js

import React from "react";
import { useAuth0 } from "../react-auth0-spa";

const NavBar = () => {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    <div>
      {!isAuthenticated && <button onClick={() => loginWithRedirect({})}>Log in</button>}

      {isAuthenticated && <button onClick={() => logout()}>Log out</button>}
    </div>
  );
};

export default NavBar;
```

##### And Replace contents of src/index.js with:

NOTE: By wrapping the root <App /> in the <Auth0Provider> component, everything within App will be able to access and use the Auth0 functionality

```jsx
// src/index.js

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { Auth0Provider } from "./react-auth0-spa";
import config from "./auth_config.json";
import history from "./utils/history";

// A function that routes the user to the right place
// after login
const onRedirectCallback = appState => {
  history.push(appState && appState.targetUrl ? appState.targetUrl : window.location.pathname);
};

ReactDOM.render(
  <Auth0Provider domain={config.domain} client_id={config.clientId} redirect_uri={window.location.origin} onRedirectCallback={onRedirectCallback}>
    <App />
  </Auth0Provider>,
  document.getElementById("root")
);

serviceWorker.unregister();
```

##### Create config file (src/auth_config.json)

```jsx
{
  "domain": "dev-8snzgxfi.auth0.com",
  "clientId": "E7mcNC6Y6OQZXQ12pSDK2YQKp7VHfmFI"
}

```

##### Make NavBar functional (Replace contents of src/App.js)

NOTE: This gets rid of the OOB React logo, and gives you the working NavBar with login buttons

```jsx
// src/App.js

import React from "react";
import NavBar from "./components/NavBar";
import { useAuth0 } from "./react-auth0-spa";

function App() {
  const { loading } = useAuth0();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header>
        <NavBar />
      </header>
    </div>
  );
}

export default App;
```

### Checkpoint (Login)

Checkpoint: At this point, this will give you a VERY basic blank application with a basic NavBar, with a "Login" button. Go ahead and try it out !

![image](https://user-images.githubusercontent.com/9342308/71633255-2cf34d80-2be1-11ea-962c-907c86edc30b.png)

### Create src/components/Profile.js

```jsx
// src/components/Profile.js

import React, { Fragment } from "react";
import { useAuth0 } from "../react-auth0-spa";

const Profile = () => {
  const { loading, user } = useAuth0();

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Fragment>
      <img src={user.picture} alt="Profile" />

      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <code>{JSON.stringify(user, null, 2)}</code>
    </Fragment>
  );
};

export default Profile;
```

### Replace src/App.js

```jsx
// src/App.js

import React from "react";
import NavBar from "./components/NavBar";

// New - import the React Router components, and the Profile page component
import { Router, Route, Switch } from "react-router-dom";
import Profile from "./components/Profile";
import history from "./utils/history";

function App() {
  return (
    <div className="App">
      {/* Don't forget to include the history module */}
      <Router history={history}>
        <header>
          <NavBar />
        </header>
        <Switch>
          <Route path="/" exact />
          <Route path="/profile" component={Profile} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
```

### Update src/components/NavBar.js

```jsx
// src/components/NavBar.js
// .. other imports

// NEW - import the Link component
import { Link } from "react-router-dom";

const NavBar = () => {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    // .. code removed for brevity

    {isAuthenticated && <button onClick={() => logout()}>Log out</button>}

    {/* NEW - add a link to the home and profile pages */}
    {isAuthenticated && (
      <span>
        <Link to="/">Home</Link>&nbsp;
        <Link to="/profile">Profile</Link>
      </span>
    )}

    //..
  );
};

export default NavBar;
```

### Checkpoint (TypeError)

Checkpoint: Tutorial says this should now be working, but you'll throw a "TypeError: Cannot read property 'loginWithRedirect' of undefined". That's because the Auth0 library isn't really loaded, so you can't yet use the "loginWithRedirect" method, because it's not ready.

Update src/App.js

```jsx
// src/App.js

import React from "react";
import NavBar from "./components/NavBar";
import { useAuth0 } from "./react-auth0-spa";

// New - import the React Router components, and the Profile page component
import { Router, Route, Switch } from "react-router-dom";
import Profile from "./components/Profile";
import history from "./utils/history";

function App() {
  const { loading } = useAuth0();

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="App">
      {/* Don't forget to include the history module */}
      <Router history={history}>
        <header>
          <NavBar />
        </header>
        <Switch>
          <Route path="/" exact />
          <Route path="/profile" component={Profile} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
```

### Checkpoint (Loading...)

This is now functional, but you might get a "Loading…" for up to a full minute. If so, be sure to check the Auth0 settings for you app, and verify that the following are set correctly: "Allowed Callback URLs", "Allowed Web Origins", and "Allowed Logout URLs"

![image](https://user-images.githubusercontent.com/9342308/71633490-6bd5d300-2be2-11ea-8972-ff97c7cb2f67.png)

### Checkpoint (Profile)

![image](https://user-images.githubusercontent.com/9342308/71633523-9889ea80-2be2-11ea-8a0a-72a7edb51b7d.png)

### Profile Redirect

if you attempt to navigate to http://localhost:3000/profile, you won't be able to see the profile, but you won't be redirected to the login flow

Create src/components/PrivateRoute.js

```jsx
// src/components/PrivateRoute.js

import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import { useAuth0 } from "../react-auth0-spa";

const PrivateRoute = ({ component: Component, path, ...rest }) => {
  const { loading, isAuthenticated, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }
    const fn = async () => {
      await loginWithRedirect({
        appState: { targetUrl: path }
      });
    };
    fn();
  }, [loading, isAuthenticated, loginWithRedirect, path]);

  const render = props => (isAuthenticated === true ? <Component {...props} /> : null);

  return <Route path={path} render={render} {...rest} />;
};

export default PrivateRoute;
```

And update src/App.js

```jsx
// src/App.js

import React from "react";
import NavBar from "./components/NavBar";
import { useAuth0 } from "./react-auth0-spa";

// New - import the React Router components, and the Profile page component
import { Router, Route, Switch } from "react-router-dom";
import Profile from "./components/Profile";
import history from "./utils/history";

// NEW - import the PrivateRoute component
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const { loading } = useAuth0();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {/* Don't forget to include the history module */}
      <Router history={history}>
        <header>
          <NavBar />
        </header>
        <Switch>
          <Route path="/" exact />
          <PrivateRoute path="/profile" component={Profile} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
```

Now when you attempt http://localhost:3000/profile, you'll be redirected to the login flow

### Simplifying this implementation

- react-auth0-spa.js: Removing setPopupOpen()
- react-auth0-spa.js: Removing handleRedirectCallback()
- react-auth0-spa.js: Added lots of comments
- App.js: Changed <Router> to <HashRouter> so we can get rid of "history" concept
- history.js: Removed it
- index.js: Changed history.push() to window.history.replaceState()
- PrivateRoute.js: Prepended "/#" to saved path since I'm using <HashRouter> now

react-auth0-spa.js

```jsx
// src/react-auth0-spa.js

import React, { useState, useEffect, useContext } from "react";
import createAuth0Client from "@auth0/auth0-spa-js";

// ---------------------------------------------------------------------------------

// Internal function
// Modifies the current history entry
// Essentially changes URL of current page without having to reload the page
// We seem to be replacing URL with the SAME current URL
// It also seems that we never actually call this function
const DEFAULT_REDIRECT_CALLBACK = () => {
  console.error("Changing Page URL:", window.location.pathname);
  // replaceState() does not manipulate browser history, it simply replaces current URL in address bar
  window.history.replaceState({}, document.title, window.location.pathname);
};

// ---------------------------------------------------------------------------------

// Exported function
// We're essentially creating/exporting a "custom hook"
// Creates Auth0Context.Consumer() and Auth0Context.Provider() functions
// For Class components, you'd wrap a child component in .Conumser() to get access to these props
// For Functional components, you can use the useContext() function
const Auth0Context = React.createContext();
export const useAuth0 = () => useContext(Auth0Context);

// ---------------------------------------------------------------------------------

// Exported function to create Auth0Client
// Functional component, uses destructuring to get "children" and onRedirectCallback props
// "children" is everything inside the actual Auth0Provider tag
// "onRedirectCallback" is a named prop that the caller might have used, with DEFAULT_REDIRECT_CALLBACK being the default (if no value was given)
export const Auth0Provider = ({ children, onRedirectCallback = DEFAULT_REDIRECT_CALLBACK, ...initOptions }) => {
  // useState() is a React Hook, retrieves simple state where do you don't lifecycle methods or a full React class component
  // Creates new state variable, arg1 to useState() is initial value, returns two values (value, and method to set value)
  const [isAuthenticated, setIsAuthenticated] = useState();
  const [user, setUser] = useState();
  const [auth0Client, setAuth0] = useState();
  const [loading, setLoading] = useState(true);

  //   -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
  // React Hook, useEffect() runs after first render, and after every re-render (DOM update)
  // Essentially a "side effect" sort of like componentDidMount, componentDidUpdate, and componentWillUnmount combined
  // 2nd arg (array) is empty, so this fn is called every time it's re-rendered
  useEffect(() => {
    const initAuth0 = async () => {
      console.warn("Creating Auth0 Client");
      const auth0FromHook = await createAuth0Client(initOptions);
      setAuth0(auth0FromHook);

      // If we just returned from Auth0, then URL will contain "code=" query param
      if (window.location.search.includes("code=")) {
        console.error("=code");
        // If we called loginWithRedirecct() with {appstate: <something>}, we'll get it back here
        const { appState } = await auth0FromHook.handleRedirectCallback();
        console.warn("appState", appState);
        console.warn("About to call onRedirectCallback()");
        onRedirectCallback(appState);
      }

      const isAuthenticated = await auth0FromHook.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const user = await auth0FromHook.getUser();
        setUser(user);
      }

      setLoading(false);
    };
    initAuth0();
    // eslint-disable-next-line
  }, []);

  //   -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
  // This is the return for the Auth0Provider component definition (Auth0Provider component is used in index.js)
  return (
    <Auth0Context.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        getIdTokenClaims: (...p) => auth0Client.getIdTokenClaims(...p),
        loginWithRedirect: (...p) => auth0Client.loginWithRedirect(...p),
        getTokenSilently: (...p) => auth0Client.getTokenSilently(...p),
        getTokenWithPopup: (...p) => auth0Client.getTokenWithPopup(...p),
        logout: (...p) => auth0Client.logout(...p)
      }}>
      {children}
    </Auth0Context.Provider>
  );
};
// End of "Auth0Provider" component
// ---------------------------------------------------------------------------------
```
