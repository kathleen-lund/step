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
 
import com.google.appengine.api.datastore.*;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
 
@WebServlet("/login-status")
public class LoginStatusServlet extends HttpServlet {
 
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    response.setContentType("application/json");
    PrintWriter out = response.getWriter();
    UserService userService = UserServiceFactory.getUserService();
 
    // If user is not logged in, show a login form (could also redirect to a login page)
    if (!userService.isUserLoggedIn()) {
      String loginUrl = userService.createLoginURL("/index.html");
      String message = "<p>Login <a href=\"" + loginUrl + "\">here</a> to post a comment.</p>";
      JsonObject json = new JsonObject();
      json.addProperty("message", message);
      out.println(json.toString());
      //out.println("<p>Login <a href=\"" + loginUrl + "\">here</a> to post a comment.</p>");
      return;
    }
 
    // If user has not set a nickname, redirect to nickname page
     String username = getUserUsername(userService.getCurrentUser().getUserId());
    if (username == null) {
        System.out.println("there may be an issue");
    }
    
    // User is logged in and has a nickname, so the request can proceed
    
    String logoutUrl = userService.createLogoutURL("/index.html");
    String message = "<p>Logout <a href=\"" + logoutUrl + "\">here</a>.</p>";
    message += "<p>Change your username <a href=\"/username.html\">here</a>.</p>";

    String userEmail = userService.getCurrentUser().getEmail();
    JsonObject json = new JsonObject();
    json.addProperty("username", username);
    json.addProperty("email", userEmail);
    json.addProperty("message", message);
    
    out.println(json.toString());
  }
 
  /** Returns the nickname of the user with id, or null if the user has not set a nickname. */
  private String getUserUsername(String id) {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Query query =
        new Query("UserInfo")
            .setFilter(new Query.FilterPredicate("id", Query.FilterOperator.EQUAL, id));
    PreparedQuery results = datastore.prepare(query);
    Entity entity = results.asSingleEntity();
    if (entity == null) {
      return null;
    }
    String username = (String) entity.getProperty("username");
    return username;
  }
}
 

