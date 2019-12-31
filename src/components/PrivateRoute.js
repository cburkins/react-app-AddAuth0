// src/components/PrivateRoute.js

import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import { useAuth0 } from "../react-auth0-spa";

const PrivateRoute = ({ component: Component, path, ...rest }) => {
  const { loading, isAuthenticated, loginWithRedirect } = useAuth0();

  // React Hook
  // useEffect runs after first render, and after every re-render (DOM update)
  // sort of like componentDidMount, componentDidUpdate, and componentWillUnmount combined
  // Only re-run if one of the following changes: isAuthenticated, loginWithRedirect, path
  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }
    const fn = async () => {
      await loginWithRedirect({
        // Have to prepend "/#" since I'm using HashRouter
        appState: { targetUrl: "/#" + path }
      });
    };
    fn();
  }, [loading, isAuthenticated, loginWithRedirect, path]);

  const render = props => (isAuthenticated === true ? <Component {...props} /> : null);

  // <Route> is from react-router-dom
  // render prop is a function that's called when route matches
  return <Route path={path} render={render} {...rest} />;
};

export default PrivateRoute;
