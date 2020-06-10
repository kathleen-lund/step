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

import com.google.appengine.api.datastore.Cursor;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
// import com.google.cloud.datastore.EntityQuery;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
// import com.google.cloud.datastore.Query;
// import com.google.cloud.datastore.QueryResults;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.QueryResultList;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.sps.data.Comment;
import java.io.IOException;
import java.lang.Integer;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Servlet responsible for getting comments from Datastore. */
@WebServlet("/get-comments")
public class GetCommentsServlet extends HttpServlet {
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    // Retrieve necessary parameters
    String commentOrderString = request.getParameter("order");
    String pageCursor = request.getParameter("pageCursor");
    int pageSize = Integer.parseInt(request.getParameter("num"));

    // Limit comment number and set cursor
    FetchOptions fetchOptions = FetchOptions.Builder.withLimit(pageSize);
    if (!pageCursor.equals("null")) {
      fetchOptions.startCursor(Cursor.fromWebSafeString(pageCursor));
    }

    // Make query with correct comment order
    Query query;
    if (commentOrderString.equals("oldest")) {
      query = new Query("Comment").addSort("timestamp", SortDirection.ASCENDING);
    } else {
      query = new Query("Comment").addSort("timestamp", SortDirection.DESCENDING);
    }

    // Query datastore
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery prepQuery = datastore.prepare(query);
    QueryResultList<Entity> entities;
    try {
      entities = prepQuery.asQueryResultList(fetchOptions);
    } catch (IllegalArgumentException e) {
      System.out.println("Invalid cursor");
      return;
    }

    // Loop through Entities and add them to comments List
    List<Comment> comments = new ArrayList<>();
    for (Entity entity : entities) {
      // Entity entity = entities.next();
      long id = entity.getKey().getId();
      String text = (String) entity.getProperty("text");
      long timestamp = (long) entity.getProperty("timestamp");
      String username = (String) entity.getProperty("username");

      // Comment object to hold all info
      Comment comment = new Comment(id, text, timestamp, username);
      comments.add(comment);
    }

    // Get nextPageCursor for return
    String nextPageCursor = entities.getCursor().toWebSafeString();

    // Format comments List to JSON for return
    Gson gson = new Gson();
    String json = gson.toJson(comments);

    // Send the JSON as the response
    response.setContentType("application/json;");

    // Build JsonObject with comments list and nextPageCursor
    JsonObject ret = new JsonObject();
    ret.addProperty("comments", json);
    ret.addProperty("nextPageCursor", nextPageCursor);

    response.getWriter().println(ret);
  }
}
