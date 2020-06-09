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
import com.google.gson.Gson;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Servlet that returns some example content. */
@WebServlet("/data")
public class DataServlet extends HttpServlet {
  static final String COMMENT_INPUT_ID = "user-comment";
  static final String USERNAME_ID = "user-name";

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    // Get the comment text, timestamp, and user name
    String comment = request.getParameter("text");
    if (comment == null || comment.equals("")) {
      response.sendRedirect("/index.html");
      return;
    }
    long timestamp = System.currentTimeMillis();
<<<<<<< HEAD
=======
    // String username = getUsername(request);
    // if (username == null || username.equals("")) {
    // response.sendRedirect("/index.html");
    // return;
    //}
>>>>>>> f45d289... Fix validator issues

    // Create entity and load with data
    Entity commentEntity = new Entity("Comment");
    commentEntity.setProperty("text", comment);
    commentEntity.setProperty("timestamp", timestamp);
    String email = request.getParameter("email");
    commentEntity.setProperty("email", email);
    String username = request.getParameter("username");
    commentEntity.setProperty("username", username);

    // Put entity into Datastore
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    datastore.put(commentEntity);

    // Redirect back to the HTML page.
    response.sendRedirect("/index.html");
  }

  /**
   * Returns the comment entered by the user.
   */
  private String getComment(HttpServletRequest request) {
    // Get the input from the form.
    return request.getParameter(COMMENT_INPUT_ID);
  }

  /**
   * Returns the name entered by the user.
   */
  private String getUsername(HttpServletRequest request) {
    // Get the input from the form.
    return request.getParameter(USERNAME_ID);
  }
}
