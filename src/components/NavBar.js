// src/components/NavBar.js

import React from "react";
// This is a useContext(Auth0Context)
import { useAuth0 } from "../react-auth0-spa";

// So it doesn't conflict with NavLink from reactstrap ?
import { NavLink as RouterNavLink } from "react-router-dom";

import { Navbar, Nav, NavItem, NavLink } from "reactstrap";

const NavBar = () => {
  // useContext() to get access to global props/methods
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  const isAuthenticatedStatus = isAuthenticated ? "Authenticated" : "Not Authenticated";

  return (
    <div className="nav-container">
      <Navbar color="light" light expand="md">
        {/* Adding "navbar" changes css class from "nav" to "navbar-nav" */}
        {/* "navbar-nav" boostrap class gives full-height and lightweight navigation */}
        {/* className of "mr-auto" seems to push the next element all the way to the right as I desire */}
        <Nav navbar className="mr-auto">
          <NavItem>
            <NavLink tag={RouterNavLink} to="/" exact activeClassName="router-link-exact-active">
              Home
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink tag={RouterNavLink} to="/page01" activeClassName="router-link-exact-active">
              Page01
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink tag={RouterNavLink} to="/profile" exact activeClassName="router-link-exact-active">
              Profile (Protected)
            </NavLink>
          </NavItem>
        </Nav>

        {/* This gets pushed to right margin by "mr-auto" above */}
        <Nav>Status: {isAuthenticatedStatus}</Nav>
        <Nav className="ml-3">
          {!isAuthenticated && <button onClick={() => loginWithRedirect({})}>Log in</button>}
          {isAuthenticated && <button onClick={() => logout()}>Log out</button>}
        </Nav>
      </Navbar>
    </div>
  );
};

export default NavBar;
