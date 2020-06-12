// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Transaction;
import com.google.appengine.api.datastore.TransactionOptions;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/username")
public class ChooseUsernameServlet extends HttpServlet {
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    if (!userService.isUserLoggedIn()) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED,
          "You cannot set a username if you are not logged in.");
      return;
    }

    String username = request.getParameter("username");
    String id = userService.getCurrentUser().getUserId();

    // Build transaction with cross-group functionality
    // so it can put both a Username and UserInfo entity
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    TransactionOptions options = TransactionOptions.Builder.withXG(true);
    Transaction transaction = datastore.beginTransaction(options);
    try {
      Entity usr = new Entity("Username", username);
      Entity check = null;
      try {
        Key usrkey = KeyFactory.createKey("Username", username);
        check = datastore.get(usrkey);
      } catch (EntityNotFoundException e) {
        // This is what we want (the entity was not found, free to use the username)
      }

      if (check != null) {
        // An entity was found with the requested username
        response.setStatus(409, "Username already exists.");
        response.getWriter().close();
        transaction.commit();
        return;
      } else {
        datastore.put(transaction, usr);
        // Make a UserInfo Entity with retrieved ID and username
        Entity entity = new Entity("UserInfo", id);
        entity.setProperty("id", id);
        entity.setProperty("username", username);
        // The put() function automatically inserts new data or updates existing data based on ID
        datastore.put(transaction, entity);
        transaction.commit();
      }
    } finally {
      if (transaction.isActive()) {
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unable to complete transaction");
      }
    }
    response.sendRedirect("/index.html");
    return;
  }
}
