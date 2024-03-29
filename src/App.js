// src/App.js

import React from "react";
import NavBar from "./components/NavBar";
import { useAuth0 } from "./react-auth0-spa";
import { Container } from "reactstrap";

// New - import the React Router components, and the Profile page component
import { HashRouter, Route, Switch } from "react-router-dom";
import Profile from "./components/Profile";
import RootPath from "./components/RootPath";
import PageOne from "./components/PageOne";

// NEW - import the PrivateRoute component
import PrivateRoute from "./components/PrivateRoute";

function App() {
  // Use custom hook, essentially grabs the "loading" via useContext()
  // loading=true means that we are still waiting to get our authentication state from Auth0
  const { loading } = useAuth0();
  if (loading) {
    return <div>Loading...</div>;
  }

  // OK, we've got our authentication state (either authenticated or NOT Authenticated)
  return (
    <div className="App">
      {/* Don't forget to include the history module */}
      <HashRouter>
        <div id="app" className="d-flex flex-column h-100">
          <NavBar />
          <Container className="flex-grow-1 mt-5">
            <Switch>
              <Route path="/" exact component={RootPath} />
              <Route path="/page01" exact component={PageOne} />
              <PrivateRoute path="/profile" component={Profile} />
            </Switch>
          </Container>
        </div>
      </HashRouter>
    </div>
  );
}

export default App;
