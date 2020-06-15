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

/* Global variables to support comment pagination */
let pageNum = 0;
let numComments = 5;
let pageCursor = null;
let cursorList = [null];
let order = 'newest';
let email = '';
let username = '';

/**
 * Adds a random fact to the page.
 */
function addRandomFact() {
  const facts = [
    'I love hot cheetos.',
    'Purple is my favorite color.',
    'I\'m horrible at remembering song lyrics.',
    'I speak some French.',
  ];

  // Pick a random fact.
  const fact = facts[Math.floor(Math.random() * facts.length)];

  // Add it to the page.
  const factContainer = document.getElementById('fact-container');
  factContainer.innerText = fact;
}

/**
 * Shows the specified blog post to the user
 * @param {number} postNum The number of which
 * blog post to show.
 */
function showBlogPost(postNum) {
  // Find the correct triangle to expand and switch its image.
  // Also change the onclick function for this button to hide the post.
  const buttonId = 'expandTriangle' + postNum;
  const button = document.getElementById(buttonId);
  if (button !== null) {
    button.src = '/images/downtriangle.jpeg';
    button.onclick = function() {
      hideBlogPost(postNum);
    };
  }

  // Show blog post content in the correct area.
  const blogPostId = 'blogPost' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    postArea.style.display = 'block';
  }

  // Automatically scroll window with post now opened.
  window.scrollBy(0, 500);
}

/**
 * Hides the specified blog post from the user
 * @param {number} postNum The number of which
 * blog post to hide.
 */
function hideBlogPost(postNum) {
  // Find the correct triangle to hide and switch its image.
  // Also change the onclick function for this button to show the post.
  const buttonId = 'expandTriangle' + postNum;
  const button = document.getElementById(buttonId);
  if (button !== null) {
    button.src = '/images/righttriangle.jpeg';
    button.onclick = function() {
      showBlogPost(postNum);
    };
  }

  // Hide blog post content from its area.
  const blogPostId = 'blogPost' + postNum;
  const postArea = document.getElementById(blogPostId);
  if (postArea !== null) {
    postArea.style.display = 'none';
  }
}

/**
 * Gets the comments using the GetCommentsServlet
 * and adds them to the site interface. Supports
 * pagination between to see all comments.
 */
async function getComments() {
  const login = await fetch('/login-status');
  const loginInfo = await login.json();
  let message = '';
  if (loginInfo.url.includes('logout')) {
    // User is logged in
    message += '<p>Logout <a href="' + loginInfo.url + '">here</a>.</p>';
    message += '<p>Change your username <a href="/username.html">here</a>.</p>';
    document.getElementById('commentForm').style.display = 'block';
    email = loginInfo.email;
    username = loginInfo.username;
    if (username === null) {
      window.open('/username.html', '_self', false);
    } else {
      document.getElementById('greetUser').innerText =
          'Hello, ' + username + '!';
    }
  } else {
    message += '<p>Login <a href="' + loginInfo.url +
        '">here</a> to post a comment.</p>';
  }
  document.getElementById('accountMessage').innerHTML = message;

  // Reset pageCursor to the one for this page before fetching
  if (pageNum >= 0 && pageNum < cursorList.length) {
    pageCursor = cursorList[pageNum];
  }

  // Fetch comments from servlet
  const responsePath = '/get-comments?order=' + order +
      '&pageCursor=' + pageCursor + '&num=' + numComments;
  const response = await fetch(responsePath);
  const resp = await response.json();

  const commentArea = document.getElementById('comment-space');
  if (commentArea !== null && resp.comments !== null) {
    if (pageNum >= (cursorList.length - 1)) {
      // Just went to a page not seen before: add its
      // cursor to the end of the array
      cursorList.push(resp.nextPageCursor);
    }
    pageCursor = cursorList[pageNum];

    // Retrieve and parse comments JSON from get-comments response
    let comments = resp.comments;
    comments = JSON.parse(comments);
    if (comments.length === 0 || comments === '') {
      // At the end: no more comments
      pageNum = pageNum - 1;
      return;
    }
    // Clear comment area in case page is being reloaded
    commentArea.innerHTML = '';

    // Append current comments to page
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const commentElement = createCommentElement(comment);
      commentArea.appendChild(commentElement);
    }
  }
}

/**
 * Retrieve the number of comments to display from the
 * drop-down menu, and re-load comments.
 */
function changeNumComments() {
  // Get the newly selected number from the drop-down
  const num = document.getElementById('numComments');
  if (num !== null) {
    numComments = num.options[num.selectedIndex].text;
    // Parse String to int
    numComments = parseInt(numComments);
    if (isNaN(numComments)) {
      // Default to 5 comments
      numComments = 5;
    }
  } else {
    // Default to show 5 comments
    numComments = 5;
  }

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Retrieve the order of comments to display from the
 * drop-down menu, and re-load comments.
 */
function changeCommentOrder() {
  // Get the newly selected order from the drop-down
  order = getCommentOrder();
  if (order == null) {
    // If could not find comment order, default to newest first
    order = 'newest';
  }

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Retrieve the comment order to display from the
 * drop-down menu.
 * @return {String} the order requested for comment
 * viewing, or null if it was not found.
 */
function getCommentOrder() {
  // Get the selected number from the dropdown
  const order = document.getElementById('commentOrder');
  if (order !== null) {
    return order.options[order.selectedIndex].value;
  }
  return null;
}

/**
 * Submit a comment using form fields using the
 * DataServlet, and reload comments.
 */
async function submitComment() {
  // Fetch comments from servlet
  const comment = document.getElementById('userComment').value;
  const responsePath =
      '/data?email=' + email + '&text=' + comment + '&username=' + username;
  const response = await fetch(responsePath);

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Delete a comment using its id and the
 * DeleteCommentServlet.
 */
async function deleteComment(comment) {
  const params = new URLSearchParams();
  params.append('id', comment.id);
  fetch('/delete-comment', {method: 'POST', body: params});

  // Reset page back to beginning
  cursorList = [null];
  pageNum = 0;
  pageCursor = null;
  getComments();
}

/**
 * Convert a Javascript Date to the AM/PM
 * format desired.
 * @return {String} the Date formatted in
 * MM/DD/YYYY, Hr:Min am/pm
 */
function toAmPmTimestamp(date) {
  const hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
  const minute = '0' + date.getMinutes();
  const label = date.getHours() > 12 ? 'pm' : 'am';
  let formatted = date.toLocaleDateString();
  formatted = formatted + ', ' + hour + ':' + minute.substr(-2) + label;
  return formatted;
}

/**
 * Moves to next page and gets/displays
 * comments for the new page.
 */
function advancePage() {
  pageNum = pageNum + 1;
  getComments();
}

/**
 * Moves to the previous page if not currently at
 * the beginning of pages, and gets/displays
 * comments for the new page.
 */
function previousPage() {
  pageNum = pageNum - 1 >= 0 ? pageNum - 1 : 0;
  getComments();
}

/**
 * Creates an element for a comment, including its delete button.
 */
function createCommentElement(comment) {
  // Article tag to encapsulate comment elements
  const commentElement = document.createElement('article');
  commentElement.className = 'comment';

  // Bold tag for the username
  const username = document.createElement('b');
  const usernameStr = comment.username + ':';
  username.innerText = usernameStr;

  // Timestamp
  const date = new Date(comment.timestamp);
  const formatted = toAmPmTimestamp(date);

  // Span tag for the comment text
  const commentText = document.createElement('span');
  // Make sure to escape comment input for HTML tags
  const escapeDiv = document.createElement('div');
  escapeDiv.innerText = comment.text;
  const html = ' ' + escapeDiv.innerHTML + '\n <i>' + formatted + '</i>';
  commentText.innerHTML = html;

  // Append username, text, and delete button to overall element
  commentElement.appendChild(username);
  commentElement.appendChild(commentText);

  // Delete button for the comment if it's your own
  if (email === comment.email) {
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.className = 'button-small';
    deleteButton.addEventListener('click', () => {
      // Delete function to remove this comment from Datastore
      deleteComment(comment);

      // Remove the comment from the DOM
      commentElement.remove();
    });
    commentElement.appendChild(deleteButton);
  }

  return commentElement;
}

/**
 * Send a requested username to the
 * ChooseUsernameServlet. Check response
 * codes for errors.
 */
async function sendUsername() {
  const username = document.getElementById('username').value;
  const responsePath = '/username?username=' + username;
  await fetch(responsePath, {method: 'POST'}).then(function(response) {
    if (response.status === 200) {
      window.open('/index.html', '_self', false);
    } else if (response.status === 409) {
      // Conflict error: username already taken
      document.getElementById('errorMessage').innerText =
          'That username is taken, please try another.';
    } else {
      // User tried to set a username using a link without being logged in
      // Send them back to home screen
      window.open('/index.html', '_self', false);
    }
  });
}

/** 
 * Creates a map showing markers/landmarks and adds it
 * to the DOM.
 */
function createMap() {
  const map = new google.maps.Map(
      document.getElementById('map'), 
      {center: {lat: 40.405284, lng: -98.597794}, zoom: 4});
 
  addLandmark(
      map, 42.284585, -87.966808, 'Libertyville High School',
      'Libertyville High School: This is where I attended highschool. Go Wildcats!')
  addLandmark(
      map, 38.647460, -90.310449, 'Danforth University Center',
      'Danforth University Center: The main university center at Washington University in St. Louis. The taco salads here are the best!')
  addLandmark(
      map, 38.640309, -90.293711, 'Art Hill',
      'Art Hill: Art Hill is in Forest Park, a large, beautiful park right next to my university. Students have been known to picnic here or sled down the hill with stolen cafeteria trays!');
  addLandmark(
      map, 38.608810, -90.205447, 'Chava\'s',
      'Chava\'s: My favorite Mexican restaurant in St. Louis is located in Soulard, which is also home of the world\'s 2nd-largest Mardi Gras celebration!')
  addLandmark(
      map, 38.647346, -90.339038, 'Invisibly, Inc.',
      'Invisibly, Inc.: This was where I had my Software Engineering Internship last summer! I learned about the ad ecosystem while working on an Android app.')
  addLandmark(
      map, 34.031441, -118.469781, 'Lionsgate Headquarters',
      'Lionsgate Headquarters: I attended a meeting here to pitch the app I worked on last summer!')
  addLandmark(
      map, 39.951910, -75.193437, 'UPenn',
      'UPenn: The site of my first hackaton, PennApps. My group made the top 40 with our sustainability iOS app!')
  addLandmark(
      map, 47.625373, -122.336449, 'Google Seattle',
      'Google Seattle: The location of my hosts :)')   
}
 
/** 
 * Adds a marker that shows an info 
 * window when clicked. 
 */
function addLandmark(map, lat, lng, title, description) {
  const marker = new google.maps.Marker(
      {position: {lat: lat, lng: lng}, map: map, title: title});
 
  const infoWindow = new google.maps.InfoWindow({content: description});
  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
}
