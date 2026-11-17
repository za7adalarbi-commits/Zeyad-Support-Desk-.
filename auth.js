/**
 * RENTAL GATE CRM — Authentication & Session Management
 */
(function (root) {
  'use strict';

  var currentUser = null;

  function getUser() {
    return currentUser;
  }

  function setUser(user) {
    currentUser = user;
  }

  async function restoreSession() {
    var token = root.RGApi.getToken();
    if (!token) return null;
    var res = await root.RGApi.callApi('getMe', {});
    if (res.success && res.data && res.data.user) {
      currentUser = res.data.user;
      return currentUser;
    }
    root.RGApi.setToken('');
    currentUser = null;
    return null;
  }

  async function login(username, password) {
    var res = await root.RGApi.callApi('login', { username: username, password: password });
    if (res.success && res.data && res.data.token) {
      root.RGApi.setToken(res.data.token);
      currentUser = res.data.user;
    }
    return res;
  }

  async function logout() {
    await root.RGApi.callApi('logout', {});
    root.RGApi.setToken('');
    currentUser = null;
  }

  root.RGAuth = {
    getUser: getUser,
    setUser: setUser,
    restoreSession: restoreSession,
    login: login,
    logout: logout
  };
})(window);
